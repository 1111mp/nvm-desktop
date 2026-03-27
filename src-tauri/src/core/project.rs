use super::handle;
use crate::{
    config::{Config, IProjects, Project, SharedDraft},
    log_err, logging,
    utils::{dirs, help, logging::Type},
};
use anyhow::{anyhow, bail, Result};
use futures::{stream, StreamExt, TryStreamExt};
use std::{
    path::{Path, PathBuf},
    process::Command,
};

pub async fn fetch_projects() -> Result<SharedDraft<IProjects>> {
    let draft = Config::projects().await;
    let data = draft.data_arc();
    Ok(data)
}

pub async fn fetch_projects_from_local() -> Result<Vec<Project>> {
    Ok(fetch_projects().await?.get_list().unwrap_or_default())
}

pub async fn fetch_projects_with_sync() -> Result<Vec<Project>> {
    let path = dirs::projects_path()?;
    let list = help::read_json::<Vec<Project>>(&path).await?;
    patch_projects(&IProjects { list: Some(list) }, false).await?;

    let draft = Config::projects().await.data_arc();
    Ok(draft.get_list().unwrap_or_default())
}

pub async fn patch_projects(patch: &IProjects, need_save_file: bool) -> Result<()> {
    Config::projects().await.edit_draft(|d| d.patch(patch));

    Config::projects().await.apply();
    if need_save_file {
        let projects_data = Config::projects().await.data_arc();
        logging!(debug, Type::Setup, "Saving Projects data to file...");
        projects_data.save_file().await?;
    }

    Ok(())
}

/// add projects
pub async fn add_projects(projects: Vec<Project>) -> Result<()> {
    let draft = Config::settings().await.data_arc();
    let node_version_file = draft.get_node_version_file();
    let node_version_file_ref = &node_version_file;

    let stream = stream::iter(projects.into_iter().map(|mut project| async move {
        let path_buf = Path::new(&project.path);
        let version_path = path_buf.join(node_version_file_ref);

        project.version = tokio::fs::read_to_string(version_path)
            .await
            .ok()
            .map(|s| s.trim().to_string());

        project
    }))
    .buffer_unordered(3);
    let new_projects = stream.collect::<Vec<Project>>().await;

    Config::projects().await.edit_draft(|d| {
        d.extend(new_projects);
    });

    let process_result: std::result::Result<(), anyhow::Error> = {
        super::tray::Tray::global().update_part().await?;
        Ok(())
    };

    if let Err(err) = process_result {
        Config::projects().await.discard();
        return Err(err);
    }
    Config::projects().await.apply();
    let projects_data = Config::projects().await.data_arc();
    logging!(debug, Type::Setup, "Saving Projects data to file...");
    projects_data.save_file().await?;
    Ok(())
}

/// update projects
pub async fn update_projects(
    payload: &IProjects,
    need_remove_path: Option<PathBuf>,
    need_refresh_tary: bool,
) -> Result<()> {
    if let Some(p) = need_remove_path {
        let draft = Config::settings().await.data_arc();
        let file_path = p.join(&draft.get_node_version_file());
        if tokio::fs::try_exists(&file_path).await.unwrap_or(false) {
            tokio::fs::remove_file(file_path).await?;
        }
    }

    Config::projects().await.edit_draft(|d| d.patch(payload));
    let process_result: std::result::Result<(), anyhow::Error> = {
        if need_refresh_tary {
            super::tray::Tray::global().update_part().await?;
        }
        Ok(())
    };

    if let Err(err) = process_result {
        Config::projects().await.discard();
        return Err(err);
    }
    Config::projects().await.apply();
    let projects_data = Config::projects().await.data_arc();
    logging!(debug, Type::Setup, "Saving Projects data to file...");
    projects_data.save_file().await?;

    Ok(())
}

/// sync project version to `.nvmdrc`
pub async fn sync_project_version(path: PathBuf, version: &str) -> Result<i32> {
    if !tokio::fs::try_exists(&path).await.unwrap_or(false) {
        return Ok(404);
    }

    let draft = Config::settings().await.data_arc();
    let node_version_file = draft.get_node_version_file();
    let path = path.join(&node_version_file);
    help::save_string(&path, version).await?;

    Ok(200)
}

/// batch update project version
pub async fn batch_update_project_version(paths: Vec<PathBuf>, version: &str) -> Result<()> {
    let draft = Config::settings().await.data_arc();
    let node_version_file = draft.get_node_version_file();
    let file_name_ref = &node_version_file;

    stream::iter(paths.into_iter().map(Ok::<_, anyhow::Error>)) // 这里的 Error 替换成你的 Result Error 类型
        .try_for_each_concurrent(3, |path| async move {
            let full_path = path.join(file_name_ref);
            help::save_string(&full_path, version).await
        })
        .await?;

    Ok(())
}

/// change project with version from menu
pub async fn change_with_version(name: &str, version: &str) -> Result<()> {
    let ret = {
        let project_path = Config::projects()
            .await
            .edit_draft(|d| d.update_version(name, version))?;
        let need_update_groups = Config::groups()
            .await
            .edit_draft(|d| d.update_projects(&project_path))?;

        sync_project_version(PathBuf::from(&project_path), &version).await?;

        log_err!(
            handle::Handle::update_tray_part_and_emit(
                "nvm-desktop://refresh-project-info",
                &version
            )
            .await
        );

        <Result<bool>>::Ok(need_update_groups)
    };

    match ret {
        Ok(need_update_groups) => {
            Config::projects().await.apply();
            let projects_data = Config::projects().await.data_arc();
            logging!(debug, Type::Cmd, "Saving Projects data to file...");
            projects_data.save_file().await?;

            if need_update_groups {
                Config::groups().await.apply();
                let groups_data = Config::groups().await.data_arc();
                logging!(debug, Type::Cmd, "Saving Groups data to file...");
                groups_data.save_file().await?;
            }

            Ok(())
        }
        Err(err) => {
            Config::projects().await.discard();
            Config::groups().await.discard();
            Err(err)
        }
    }
}

/// change project with group from menu
pub async fn change_with_group(name: &str, group_name: &str) -> Result<()> {
    let ret = {
        let project_path = Config::projects()
            .await
            .edit_draft(|d| d.update_version(name, group_name))?;
        let version = Config::groups()
            .await
            .edit_draft(|d| d.update_projects_version(&project_path, group_name))?
            .ok_or_else(|| anyhow!("failed to find the group version \"name:{}\"", &group_name))?;

        sync_project_version(PathBuf::from(&project_path), &version).await?;

        log_err!(
            handle::Handle::update_tray_part_and_emit(
                "nvm-desktop://refresh-project-info",
                &version
            )
            .await
        );

        <Result<()>>::Ok(())
    };

    match ret {
        Ok(()) => {
            Config::projects().await.apply();
            let projects_data = Config::projects().await.data_arc();
            logging!(debug, Type::Cmd, "Saving Projects data to file...");
            projects_data.save_file().await?;

            Config::groups().await.apply();
            let groups_data = Config::groups().await.data_arc();
            logging!(debug, Type::Cmd, "Saving Groups data to file...");
            groups_data.save_file().await?;

            Ok(())
        }
        Err(err) => {
            Config::projects().await.discard();
            Config::groups().await.discard();
            Err(err)
        }
    }
}

pub async fn update_from_notice(name: &str, version: &str) -> Result<()> {
    let ret = {
        let project_path = Config::projects()
            .await
            .edit_draft(|d| d.update_version(name, version))?;
        let need_update_groups = if Config::groups().await.data_arc().exsist(version) {
            Config::groups()
                .await
                .edit_draft(|d| d.update_projects_version(&project_path, version))?;
            true
        } else {
            Config::groups()
                .await
                .edit_draft(|d| d.update_projects(&project_path))?
        };

        <Result<bool>>::Ok(need_update_groups)
    };

    match ret {
        Ok(need_update_groups) => {
            Config::projects().await.apply();

            if need_update_groups {
                Config::groups().await.apply();
            }

            Ok(())
        }
        Err(err) => {
            Config::projects().await.discard();
            Config::groups().await.discard();
            Err(err)
        }
    }
}

pub async fn open_with_vscode(path: String) -> Result<()> {
    let draft = Config::settings().await.data_arc();
    let Some(cmd) = draft.coder.clone() else {
        bail!("coder should not be null");
    };

    let mut command = Command::new(cmd);
    command.arg(&path);
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        use windows::Win32::System::Threading::CREATE_NO_WINDOW;
        command.creation_flags(CREATE_NO_WINDOW.0);
    }
    command.status()?;
    Ok(())
}

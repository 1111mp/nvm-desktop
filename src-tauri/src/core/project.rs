use std::path::PathBuf;

use crate::{
    config::{Config, Project},
    log_err,
    utils::{dirs, help},
};
use anyhow::{anyhow, Result};
use futures::{stream, StreamExt};
use serde::{Deserialize, Serialize};
use tauri_plugin_dialog::{DialogExt, FilePath};

use super::handle;

/// get project list from `projects.json`
pub async fn project_list(fetch: Option<bool>) -> Result<Option<Vec<Project>>> {
    let fetch = fetch.unwrap_or(false);
    if !fetch {
        return Ok(Config::projects().latest_ref().get_list());
    }

    let path = dirs::projects_path()?;
    let list = help::async_read_json::<Vec<Project>>(&path).await?;

    // update projects
    Config::projects().draft_mut().update_list(&list)?;
    Config::projects().apply();

    Ok(Some(list))
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct PInfo {
    /// project floder path
    pub path: PathBuf,

    /// project version default from `.nvmdrc`
    pub version: Option<String>,
}

/// add projects
pub async fn select_projects(app_handle: tauri::AppHandle) -> Result<Option<Vec<PInfo>>> {
    if let Some(file_paths) = app_handle.dialog().file().blocking_pick_folders() {
        let mut p_info = Vec::new();
        let version_file_name = Config::settings().latest_ref().get_node_version_file();
        for file_path in file_paths {
            if let FilePath::Path(path) = file_path {
                let nvmdrc_path = path.join(&version_file_name);
                let version = if nvmdrc_path.exists() {
                    Some(help::async_read_string(&nvmdrc_path).await?)
                } else {
                    None
                };
                p_info.push(PInfo { path, version });
            }
        }
        Ok(Some(p_info))
    } else {
        Ok(None)
    }
}

/// update projects
pub async fn update_projects(list: Vec<Project>, path: Option<PathBuf>) -> Result<()> {
    if let Some(path) = path {
        let node_version_file = Config::settings().latest_ref().get_node_version_file();
        let nvmdrc = path.join(&node_version_file);
        if nvmdrc.exists() {
            tokio::fs::remove_file(nvmdrc).await?;
        }
    }

    Config::projects().draft_mut().update_list(&list)?;
    Config::projects().apply();
    Config::projects().data_mut().save_file()?;

    log_err!(handle::Handle::update_systray_part());

    Ok(())
}

/// sync project version to `.nvmdrc`
pub async fn sync_project_version(path: PathBuf, version: &str) -> Result<i32> {
    if !path.exists() {
        return Ok(404);
    }

    let node_version_file = Config::settings().latest_ref().get_node_version_file();
    let path = path.join(&node_version_file);
    help::async_save_string(&path, version).await?;

    Ok(200)
}

/// batch update project version
pub async fn batch_update_project_version(paths: Vec<PathBuf>, version: String) -> Result<()> {
    let node_version_file = Config::settings().latest_ref().get_node_version_file();
    let result = stream::iter(paths.into_iter())
        .map(|path| {
            let version = version.clone();
            let file_name = node_version_file.clone();
            async move {
                let path = path.join(file_name);
                help::async_save_string(&path, &version).await
            }
        })
        .buffer_unordered(3)
        .collect::<Vec<_>>()
        .await;

    for ret in result {
        ret?;
    }

    Ok(())
}

/// change project with version from menu
pub async fn change_with_version(name: String, version: String) -> Result<()> {
    let ret = {
        let project_path = Config::projects()
            .draft_mut()
            .update_version(&name, &version)?;
        let need_update_groups = Config::groups()
            .draft_mut()
            .update_projects(&project_path)?;

        sync_project_version(PathBuf::from(&project_path), &version).await?;

        log_err!(handle::Handle::update_systray_part_with_emit(
            "nvm-desktop://refresh-project-info",
            &version
        ));

        <Result<bool>>::Ok(need_update_groups)
    };

    match ret {
        Ok(need_update_groups) => {
            Config::projects().apply();
            Config::projects().data_mut().save_file()?;

            if need_update_groups {
                Config::groups().apply();
                Config::groups().data_mut().save_file()?;
            }

            Ok(())
        }
        Err(err) => {
            Config::projects().discard();
            Config::groups().discard();
            Err(err)
        }
    }
}

/// change project with group from menu
pub async fn change_with_group(name: String, group_name: String) -> Result<()> {
    let ret = {
        let project_path = Config::projects()
            .draft_mut()
            .update_version(&name, &group_name)?;
        let version = Config::groups()
            .draft_mut()
            .update_projects_version(&project_path, &group_name)?
            .ok_or_else(|| anyhow!("failed to find the group version \"name:{}\"", &group_name))?;

        sync_project_version(PathBuf::from(&project_path), &version).await?;

        log_err!(handle::Handle::update_systray_part_with_emit(
            "nvm-desktop://refresh-project-info",
            &version
        ));

        <Result<()>>::Ok(())
    };

    match ret {
        Ok(()) => {
            Config::projects().apply();
            Config::projects().data_mut().save_file()?;

            Config::groups().apply();
            Config::groups().data_mut().save_file()?;

            Ok(())
        }
        Err(err) => {
            Config::projects().discard();
            Config::groups().discard();
            Err(err)
        }
    }
}

pub async fn update_from_notice(name: &str, version: &str) -> Result<()> {
    let ret = {
        let project_path = Config::projects()
            .draft_mut()
            .update_version(name, version)?;

        let need_update_groups = if Config::groups().data_ref().exsist(version) {
            Config::groups()
                .draft_mut()
                .update_projects_version(&project_path, version)?;
            true
        } else {
            Config::groups()
                .draft_mut()
                .update_projects(&project_path)?
        };

        <Result<bool>>::Ok(need_update_groups)
    };

    match ret {
        Ok(need_update_groups) => {
            Config::projects().apply();

            if need_update_groups {
                Config::groups().apply();
            }

            Ok(())
        }
        Err(err) => {
            Config::projects().discard();
            Config::groups().discard();
            Err(err)
        }
    }
}

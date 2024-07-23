use std::path::PathBuf;

use crate::{
    config::{Config, Project},
    core::group::update_groups,
    log_err,
    utils::{dirs, help},
};
use anyhow::{Ok, Result};
use futures::{stream, StreamExt};
use serde::{Deserialize, Serialize};
use tauri::http::version;
use tauri_plugin_dialog::DialogExt;

use super::handle;

/// get project list from `projects.json`
pub async fn project_list(fetch: Option<bool>) -> Result<Option<Vec<Project>>> {
    let fetch = fetch.unwrap_or(false);
    if !fetch {
        return Ok(Config::projects().latest().list.clone());
    }

    let path = dirs::projects_path()?;
    let list = help::async_read_json::<Vec<Project>>(&path).await?;

    // update projects
    Config::projects().apply();
    Config::projects().data().update_list(&list)?;

    Ok(Some(list))
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct PInfo {
    /// project floder path
    pub path: PathBuf,

    /// project version from `.nvmdrc`
    pub version: Option<String>,
}

/// add projects
pub async fn add_projects(app_handle: tauri::AppHandle) -> Result<Option<Vec<PInfo>>> {
    let file_paths = app_handle.dialog().file().blocking_pick_folders();
    if file_paths.is_none() {
        return Ok(None);
    }

    let file_paths = file_paths.unwrap();
    let mut p_info = vec![];
    for file_path in file_paths {
        let nvmdrc_path = file_path.join(".nvmdrc");
        let version = if nvmdrc_path.exists() {
            Some(help::async_read_string(&nvmdrc_path).await?)
        } else {
            None
        };
        p_info.push(PInfo {
            path: file_path,
            version,
        });
    }

    Ok(Some(p_info))
}

/// update projects
pub async fn update_projects(list: Vec<Project>, path: Option<PathBuf>) -> Result<()> {
    if let Some(path) = path {
        tokio::fs::remove_file(&path.join(".nvmdrc")).await?;
    }

    Config::projects().apply();
    Config::projects().data().update_and_save_list(list)?;
    Ok(())
}

/// update project version
pub async fn update_project_version(path: PathBuf, version: &String) -> Result<i32> {
    if !path.exists() {
        return Ok(404);
    }

    let path = path.join(".nvmdrc");
    help::save_string(&path, version).await?;

    Ok(200)
}

/// batch update project version
pub async fn batch_update_project_version(paths: Vec<PathBuf>, version: String) -> Result<()> {
    let result = stream::iter(paths.into_iter())
        .map(|path| {
            let version = version.clone();
            async move {
                let path = path.join(".nvmdrc");
                help::save_string(&path, &version).await
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
    let projects = { Config::projects().latest().get_list() };
    let mut projects = match projects {
        Some(projects) => projects,
        None => return Ok(()),
    };

    let mut project_path: Option<String> = None;
    for project in &mut projects {
        if project.name == name {
            project_path = Some(project.path.clone());
            project.version = Some(version.clone());
            update_project_version(PathBuf::from(&project.path), &version).await?;
        }
    }

    if let Some(project_path) = project_path {
        let groups = { Config::groups().latest().get_list() };
        if let Some(mut groups) = groups {
            let mut need_update = false;
            for group in &mut groups {
                if group.projects.contains(&project_path) {
                    need_update = true;
                    group.projects.retain(|x| x != &project_path);
                }
            }
            if need_update {
                update_groups(groups).await?;
            }
        }
    }

    update_projects(projects, None).await?;
    log_err!(handle::Handle::update_systray_part(version));

    Ok(())
}

/// change project with group from menu
pub async fn change_with_group(name: String, group_name: String) -> Result<()> {
    let projects = { Config::projects().latest().get_list() };
    let groups = { Config::groups().latest().get_list() };
    let mut projects = match projects {
        Some(projects) => projects,
        None => return Ok(()),
    };
    let mut groups = match groups {
        Some(groups) => groups,
        None => return Ok(()),
    };
    let mut project_path: Option<String> = None;
    let mut version: Option<String> = None;

    for project in &mut projects {
        if project.name == name {
            project_path = Some(project.path.clone());
            project.version = Some(group_name.clone());
            break;
        }
    }

    let project_path = match project_path {
        Some(path) => path,
        None => return Ok(()),
    };

    for group in &mut groups {
        if group.projects.contains(&project_path) {
            group.projects.retain(|x| x != &project_path);
        }

        if group.name == group_name {
            version = group.version.clone();
            group.projects.push(project_path.clone());
        }
    }

    let version = match version {
        Some(version) => version,
        None => return Ok(()),
    };

    let update_version_future = update_project_version(PathBuf::from(&project_path), &version);
    let update_groups_future = update_groups(groups);
    let update_projects_future = update_projects(projects, None);

    tokio::try_join!(
        update_version_future,
        update_groups_future,
        update_projects_future
    )?;

    log_err!(handle::Handle::update_systray_part(version));

    Ok(())
}

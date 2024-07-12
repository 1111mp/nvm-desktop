use std::path::PathBuf;

use crate::{
    config::{Config, Project},
    utils::{dirs, help},
};
use anyhow::Result;
use serde::{Deserialize, Serialize};
use tauri_plugin_dialog::DialogExt;

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
    for file_path in file_paths {
        let version = help::async_read_json(&file_path.join(".nvmdrc")).await?;
    }

    Ok(Some(file_paths))
}

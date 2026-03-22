use super::CmdResult;
use crate::{
    cmd::StringifyErr,
    config::{IProjects, Project},
    core::project,
};
use std::path::PathBuf;

/// get project list
#[tauri::command]
pub async fn project_list(fetch: Option<bool>) -> CmdResult<Option<Vec<Project>>> {
    let fetch = fetch.unwrap_or(false);
    if fetch {
        project::fetch_projects_with_sync().await.stringify_err()
    } else {
        project::fetch_projects_from_local().await.stringify_err()
    }
}

/// add projects
#[tauri::command]
pub async fn add_projects(projects: Vec<Project>) -> CmdResult {
    project::add_projects(projects).await.stringify_err()
}

/// update projects
#[tauri::command]
pub async fn update_projects(payload: IProjects, path: Option<PathBuf>) -> CmdResult<()> {
    project::update_projects(&payload, path, true)
        .await
        .stringify_err()
}

/// update projects don't refresh tray
#[tauri::command]
pub async fn update_projects_without_tray(
    payload: IProjects,
    path: Option<PathBuf>,
) -> CmdResult<()> {
    project::update_projects(&payload, path, false)
        .await
        .stringify_err()
}

/// update project version
#[tauri::command]
pub async fn sync_project_version(path: PathBuf, version: String) -> CmdResult<i32> {
    project::sync_project_version(path, &version)
        .await
        .stringify_err()
}

/// batch update project version
#[tauri::command]
pub async fn batch_update_project_version(paths: Vec<PathBuf>, version: String) -> CmdResult<()> {
    project::batch_update_project_version(paths, &version)
        .await
        .stringify_err()
}

/// open project with VsCode
#[tauri::command]
pub async fn open_with_vscode(path: String) -> CmdResult {
    project::open_with_vscode(path).await.stringify_err()
}

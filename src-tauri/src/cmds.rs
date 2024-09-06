use anyhow::Result;
use std::path::PathBuf;
use tauri_plugin_updater::UpdaterExt;

use crate::{
    config::{Config, Group, ISettings, NVersion, Project},
    core::{group, node, project, update},
    ret_err, wrap_err,
};

type CmdResult<T = ()> = Result<T, String>;

/// get current version
#[tauri::command]
pub fn current(fetch: Option<bool>) -> CmdResult<Option<String>> {
    wrap_err!(node::get_current(fetch))
}

/// set current version
#[tauri::command]
pub async fn set_current(version: Option<String>) -> CmdResult<()> {
    wrap_err!(node::set_current(version).await)
}

/// fetch node version list
#[tauri::command]
pub async fn version_list(fetch: Option<bool>) -> CmdResult<Option<Vec<NVersion>>> {
    wrap_err!(node::get_version_list(fetch).await)
}

/// read node installed version list
#[tauri::command]
pub async fn installed_list(fetch: Option<bool>) -> CmdResult<Option<Vec<String>>> {
    wrap_err!(node::get_installed_list(fetch).await)
}

/// read settings
#[tauri::command]
pub async fn read_settings() -> CmdResult<ISettings> {
    Ok(Config::settings().data().clone())
}

/// update settings
#[tauri::command]
pub async fn update_settings(settings: ISettings) -> CmdResult<()> {
    Config::settings().apply();
    wrap_err!({ Config::settings().data().patch_settings(settings) })
}

/// install node
#[tauri::command]
pub async fn install_node(
    window: tauri::Window,
    version: Option<String>,
    arch: Option<String>,
) -> CmdResult<String> {
    wrap_err!(node::install_node(window, version, arch).await)
}

/// install node
#[tauri::command]
pub async fn install_node_cancel() -> CmdResult<()> {
    wrap_err!(node::install_node_cancel().await)
}

/// uninstall node
#[tauri::command]
pub async fn uninstall_node(version: Option<String>, current: Option<bool>) -> CmdResult<()> {
    if version.is_none() {
        ret_err!("version should not be null");
    }

    let version = version.unwrap();
    wrap_err!(node::uninstall_node(version, current).await)
}

/// get project list
#[tauri::command]
pub async fn project_list(fetch: Option<bool>) -> CmdResult<Option<Vec<Project>>> {
    wrap_err!(project::project_list(fetch).await)
}

/// add projects
#[tauri::command]
pub async fn select_projects(
    app_handle: tauri::AppHandle,
) -> CmdResult<Option<Vec<project::PInfo>>> {
    wrap_err!(project::select_projects(app_handle).await)
}

/// update projects
#[tauri::command]
pub async fn update_projects(list: Vec<Project>, path: Option<PathBuf>) -> CmdResult<()> {
    wrap_err!(project::update_projects(list, path).await)
}

/// update project version
#[tauri::command]
pub async fn sync_project_version(path: PathBuf, version: String) -> CmdResult<i32> {
    wrap_err!(project::sync_project_version(path, &version).await)
}

/// batch update project version
#[tauri::command]
pub async fn batch_update_project_version(paths: Vec<PathBuf>, version: String) -> CmdResult<()> {
    wrap_err!(project::batch_update_project_version(paths, version).await)
}

/// get group list
#[tauri::command]
pub async fn group_list(fetch: Option<bool>) -> CmdResult<Option<Vec<Group>>> {
    wrap_err!(group::group_list(fetch).await)
}

/// update groups
#[tauri::command]
pub async fn update_groups(list: Vec<Group>) -> CmdResult<()> {
    wrap_err!(group::update_groups(list).await)
}

/// update group version
#[tauri::command]
pub async fn update_group_version(name: String, version: String) -> CmdResult<()> {
    wrap_err!(group::update_group_version(name, version).await)
}

/// check app update
#[tauri::command]
pub async fn app_check_update(app_handle: tauri::AppHandle) -> CmdResult<()> {
    wrap_err!(update::app_check_update(&app_handle).await)
}

/// exit app
#[tauri::command]
pub fn exit_app(app_handle: tauri::AppHandle) {
    app_handle.exit(0);
    std::process::exit(0);
}

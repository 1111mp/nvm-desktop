use anyhow::Result;
use std::path::PathBuf;

use crate::{
    config::{Config, Group, ISettings, NVersion, Project},
    core::{configration, group, handle, node, project},
    ret_err,
    utils::dirs,
    wrap_err,
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
    let locale = Config::settings().latest().get_locale();
    let directory = Config::settings().latest().get_directory();

    wrap_err!({ Config::settings().latest().patch_settings(settings.clone()) });
    Config::settings().apply();

    // refresh data when directory changes
    if directory != settings.directory {
        wrap_err!(node::get_installed_list(Some(true)).await);
    }
    // update system tray
    if locale != settings.locale || directory != settings.directory {
        wrap_err!(handle::Handle::update_systray_part());
    }

    Ok(())
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

/// configration export
#[tauri::command]
pub async fn configration_export(
    output_path: PathBuf,
    configration: configration::ConfigrationExport,
) -> CmdResult<()> {
    wrap_err!(configration::configration_export(output_path, configration).await)
}

/// configration import
#[tauri::command]
pub async fn configration_import(
    app_handle: tauri::AppHandle,
    sync: bool,
) -> CmdResult<Option<configration::ConfigrationImport>> {
    wrap_err!(configration::configration_import(&app_handle, sync).await)
}

/// open data dir `.nvmd`
#[tauri::command]
pub fn open_data_dir() -> CmdResult<()> {
    let data_dir: PathBuf = wrap_err!(dirs::nvmd_home_dir())?;
    wrap_err!(open::that(data_dir))
}

/// open logs dir
#[tauri::command]
pub fn open_logs_dir() -> CmdResult<()> {
    let logs_dir: PathBuf = wrap_err!(dirs::app_logs_dir())?;
    wrap_err!(open::that(logs_dir))
}

/// open project dir with the File Explorer
#[tauri::command]
pub fn open_dir(dir: String) -> CmdResult<()> {
    wrap_err!(open::that(dir))
}

/// restart app
#[tauri::command]
pub fn restart(app_handle: tauri::AppHandle) {
    app_handle.restart()
}

/// exit app
#[tauri::command]
pub fn exit_app(app_handle: tauri::AppHandle) {
    app_handle.exit(0);
    std::process::exit(0);
}

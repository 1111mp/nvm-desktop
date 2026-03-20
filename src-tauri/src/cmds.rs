use anyhow::Result;
use dark_light::{detect as detect_system_theme, Mode as SystemTheme};
use std::{path::PathBuf, process::Command};
use tauri_plugin_window_state::{AppHandleExt, StateFlags};

use crate::{
    config::{Config, Group, ISettings, ISettingsResponse, NVersion, Project},
    core::{configuration, group, handle, node, project},
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
pub async fn read_settings() -> CmdResult<ISettingsResponse> {
    let setting_data = Config::settings().latest_ref().clone();
    Ok(ISettingsResponse::from(*setting_data))
}

/// update settings
#[tauri::command]
pub async fn update_settings(payload: ISettings) -> CmdResult<()> {
    let settings = Config::settings().latest_ref().clone();
    let locale = settings.locale;
    let directory = settings.directory;

    wrap_err!({
        Config::settings()
            .draft_mut()
            .patch_settings(payload.clone())
    })?;
    Config::settings().apply();

    // refresh data when directory changes
    if directory != payload.directory {
        wrap_err!(node::get_installed_list(Some(true)).await)?;
    }
    // update system tray
    if locale != payload.locale || directory != payload.directory {
        wrap_err!(handle::Handle::update_systray_part())?;
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
pub async fn uninstall_node(version: String) -> CmdResult<()> {
    wrap_err!(node::uninstall_node(version).await)
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
    configration: configuration::ConfigurationExport,
) -> CmdResult<()> {
    wrap_err!(configuration::configuration_export(output_path, configration).await)
}

/// configration import
#[tauri::command]
pub async fn configration_import(
    app_handle: tauri::AppHandle,
    sync: bool,
) -> CmdResult<Option<configuration::ConfigurationImport>> {
    wrap_err!(configuration::configuration_import(&app_handle, sync).await)
}

/// open project with VsCode
#[tauri::command]
pub async fn open_with_vscode(path: String) -> CmdResult<()> {
    let cmd = { Config::settings().latest_ref().coder.clone() }.unwrap();
    let mut command = Command::new(cmd);
    command.arg(&path);

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        use windows::Win32::System::Threading::CREATE_NO_WINDOW;
        command.creation_flags(CREATE_NO_WINDOW.0);
    }

    wrap_err!(command.status())?;
    Ok(())
}

/// open app config dir
#[tauri::command]
pub fn open_config_dir() -> CmdResult<()> {
    let data_dir: PathBuf = wrap_err!(dirs::app_config_dir())?;
    wrap_err!(open::that(data_dir))
}

/// open app data dir `.nvmd`
#[tauri::command]
pub fn open_data_dir() -> CmdResult<()> {
    let data_dir: PathBuf = wrap_err!(dirs::nvmd_home_dir())?;
    wrap_err!(open::that(data_dir))
}

/// open app logs dir
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

#[tauri::command]
pub fn get_system_theme() -> CmdResult<String> {
    let theme = match detect_system_theme() {
        Ok(SystemTheme::Dark) => "dark",
        Ok(SystemTheme::Light) => "light",
        Ok(SystemTheme::Unspecified) | Err(_) => "light",
    };
    Ok(theme.to_string())
}

/// restart app
#[tauri::command]
pub fn restart(app_handle: tauri::AppHandle) {
    let _ = app_handle.save_window_state(StateFlags::default());
    app_handle.restart()
}

/// exit app
#[tauri::command]
pub fn exit_app(app_handle: tauri::AppHandle) {
    app_handle.exit(0);
}

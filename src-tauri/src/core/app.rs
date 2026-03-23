use crate::{
    core::handle,
    logging_error,
    utils::{dirs, logging::Type},
};
use anyhow::Result;
use dark_light::{detect as detect_system_theme, Mode as SystemTheme};

pub fn open_dir(dir: String) -> Result<()> {
    open::that(&dir)?;
    Ok(())
}

/// open app config dir
pub fn open_config_dir() -> Result<()> {
    let data_dir = dirs::app_config_dir()?;
    open::that(data_dir)?;
    Ok(())
}

/// open app data dir `.nvmd`
pub fn open_data_dir() -> Result<()> {
    let data_dir = dirs::nvmd_home_dir()?;
    open::that(data_dir)?;
    Ok(())
}

/// open app logs dir
pub fn open_logs_dir() -> Result<()> {
    let logs_dir = dirs::app_logs_dir()?;
    open::that(logs_dir)?;
    Ok(())
}

pub fn get_system_theme() -> Result<String> {
    let theme = match detect_system_theme() {
        Ok(SystemTheme::Dark) => "dark",
        Ok(SystemTheme::Light) => "light",
        Ok(SystemTheme::Unspecified) | Err(_) => "light",
    };
    Ok(theme.to_string())
}

pub fn open_devtools() {
    if let Some(window) = handle::Handle::global().get_main_window() {
        window.open_devtools();
    }
}

pub fn hide() {
    let app_handle = handle::Handle::app_handle();

    #[cfg(target_os = "macos")]
    let _ = app_handle.set_dock_visibility(false);

    if let Some(window) = handle::Handle::global().get_main_window() {
        logging_error!(Type::Window, window.hide());
    }
}

pub fn restart(app_handle: &tauri::AppHandle) -> Result<()> {
    handle::Handle::global().set_is_exiting();
    app_handle.restart()
}

pub fn exit_app() {
    handle::Handle::global().set_is_exiting();

    let app_handle = handle::Handle::app_handle();
    app_handle.exit(0);
}

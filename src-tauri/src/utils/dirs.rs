use anyhow::Result;
use dirs::home_dir;
use std::path::PathBuf;
use tauri::Manager;

use crate::core::handle;

static APP_ID: &str = ".nvmd";

/// get the nvmd home dir
pub fn nvmd_home_dir() -> Result<PathBuf> {
    Ok(home_dir()
        .ok_or(anyhow::anyhow!("failed to get app home dir"))?
        .join(APP_ID))
}

/// get the `settings.json` path
pub fn settings_path() -> Result<PathBuf> {
    Ok(nvmd_home_dir()?.join("setting.json"))
}

/// get the `projects.json` file path
pub fn projects_path() -> Result<PathBuf> {
    Ok(nvmd_home_dir()?.join("projects.json"))
}

/// get the `groups.json` file path
pub fn groups_path() -> Result<PathBuf> {
    Ok(nvmd_home_dir()?.join("groups.json"))
}

/// get the migration file path
pub fn migration_path() -> Result<PathBuf> {
    Ok(nvmd_home_dir()?.join("migration"))
}

/// get the migration file path
pub fn bin_path() -> Result<PathBuf> {
    Ok(nvmd_home_dir()?.join("bin"))
}

/// get the default version path
pub fn default_version_path() -> Result<PathBuf> {
    Ok(nvmd_home_dir()?.join("default"))
}

/// get the version list path
pub fn version_list_path() -> Result<PathBuf> {
    Ok(nvmd_home_dir()?.join("versions.json"))
}

/// get the default install directory
pub fn default_install_dir() -> PathBuf {
    match nvmd_home_dir() {
        Ok(home_dir) => home_dir.join("versions"),
        Err(_) => PathBuf::from(""),
    }
}

/// get the resources dir
pub fn app_resources_dir() -> Result<PathBuf> {
    let handle = handle::Handle::global();
    let app_handle = handle.app_handle.lock();
    if let Some(app_handle) = app_handle.as_ref() {
        let res_dir = app_handle.path().resource_dir()?.join("resources");
        return Ok(res_dir);
    }
    Err(anyhow::anyhow!("failed to get the resource dir"))
}

/// get the logs dir
pub fn app_logs_dir() -> Result<PathBuf> {
    let handle = handle::Handle::global();
    let app_handle = handle.app_handle.lock();
    if let Some(app_handle) = app_handle.as_ref() {
        let res_dir = app_handle.path().app_log_dir()?;
        return Ok(res_dir);
    }
    Err(anyhow::anyhow!("failed to get the logs dir"))
}

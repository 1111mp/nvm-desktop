use anyhow::Result;
use dirs::home_dir;
use std::{env, fs, path::PathBuf};
use tauri::Manager;

use crate::core::handle;

/// get the nvmd home dir
pub fn nvmd_home_dir() -> Result<PathBuf> {
    let home_dir = match env::var_os("NVMD_HOME") {
        Some(home) => PathBuf::from(home),
        None => defaul_home_dir()?,
    };
    Ok(home_dir)
}

/// the default nvmd home dir
pub fn defaul_home_dir() -> Result<PathBuf> {
    Ok(home_dir()
        .ok_or(anyhow::anyhow!("failed to get app home dir"))?
        .join(".nvmd"))
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
        Ok(home_dir) => {
            let install_dir = home_dir.join("versions");
            if !install_dir.exists() {
                let _ = fs::create_dir_all(&install_dir);
            }
            install_dir
        }
        Err(_) => PathBuf::from(""),
    }
}

/// get the resources dir
pub fn app_resources_dir() -> Result<PathBuf> {
    let app_handle = handle::Handle::app_handle();
    match app_handle.path().resource_dir() {
        Ok(dir) => Ok(dir.join("resources")),
        Err(e) => {
            log::error!(target:"app", "Failed to get the resource directory: {}", e);
            Err(anyhow::anyhow!("Failed to get the resource directory"))
        }
    }
}

/// get the logs dir
pub fn app_config_dir() -> Result<PathBuf> {
    let app_handle = handle::Handle::app_handle();
    match app_handle.path().app_config_dir() {
        Ok(dir) => Ok(dir),
        Err(e) => {
            log::error!(target:"app", "Failed to get the config directory: {}", e);
            Err(anyhow::anyhow!("Failed to get the config directory"))
        }
    }
}

/// get the logs dir
pub fn app_logs_dir() -> Result<PathBuf> {
    let app_handle = handle::Handle::app_handle();
    match app_handle.path().app_log_dir() {
        Ok(dir) => Ok(dir),
        Err(e) => {
            log::error!(target:"app", "Failed to get the logs directory: {}", e);
            Err(anyhow::anyhow!("Failed to get the logs directory"))
        }
    }
}

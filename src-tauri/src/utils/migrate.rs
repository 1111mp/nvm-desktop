use anyhow::Result;
use std::{fs, os::unix::fs::symlink, thread, time::Duration};
use tauri::{Emitter, Manager};

use super::{dirs, help};
use crate::core::handle;

const CURRENT_MIGRATION_VERSION: i16 = 13;
const NODE_DEFAULT_EXECUTE: [&str; 4] = ["node", "npm", "npx", "corepack"];

pub fn init() -> Result<()> {
    thread::spawn(move || {
        if let Err(err) = update_schema() {
            log::error!(target: "migrate", "{err}");
            // Delay 1s before sending events to the window
            thread::sleep(Duration::from_secs(1));
            let handle = handle::Handle::global();
            let app_handle = handle.app_handle.lock();
            if let Some(app_handle) = app_handle.as_ref() {
                if let Some(window) = app_handle.get_webview_window("main") {
                    let _ = window.emit("app-migration-error", ());
                }
            }
        }
    });

    Ok(())
}

fn update_schema() -> Result<()> {
    let mut schema_version = get_schema_version()?;

    if schema_version == 0 {
        update_schema_from_basic()?;
        schema_version = CURRENT_MIGRATION_VERSION;
    }

    if schema_version < CURRENT_MIGRATION_VERSION {
        update_schema_to_last()?;
    }

    Ok(())
}

/// default schema version is 0
fn get_schema_version() -> Result<i16> {
    match dirs::migration_path().and_then(|path| help::read_string(&path)) {
        Ok(schema) => Ok(schema.parse::<i16>().unwrap_or(0)),
        Err(err) => {
            log::error!(target: "migrate", "{err}");
            Ok(0)
        }
    }
}

#[cfg(windows)]
fn update_schema_from_basic() -> Result<()> {
    let res_dir = dirs::app_resources_dir()?;
    let bin_path = ensure_bin_path_exists()?;
    let nvmd_exe_source = res_dir.join("nvmd.exe");
    let nvmd_cmd_source = res_dir.join("temp.cmd");

    fs::copy(&nvmd_exe_source, bin_path.join("nvmd.exe"))?;
    for name in NODE_DEFAULT_EXECUTE {
        fs::copy(&nvmd_exe_source, bin_path.join(format!("{}.exe", name)))?;
        if name != "node" {
            fs::copy(&nvmd_cmd_source, bin_path.join(format!("{}.cmd", name)))?;
        }
    }
    save_schema_version(CURRENT_MIGRATION_VERSION)?;
    Ok(())
}

#[cfg(unix)]
fn update_schema_from_basic() -> Result<()> {
    let res_dir = dirs::app_resources_dir()?;
    let bin_path = ensure_bin_path_exists()?;
    let nvmd_exe_path = bin_path.join("nvmd");

    fs::copy(res_dir.join("nvmd"), &nvmd_exe_path)?;
    for name in NODE_DEFAULT_EXECUTE {
        symlink(&nvmd_exe_path, bin_path.join(name))?;
    }
    save_schema_version(CURRENT_MIGRATION_VERSION)?;
    Ok(())
}

#[cfg(windows)]
fn update_schema_to_last() -> Result<()> {
    use anyhow::bail;

    let res_dir = dirs::app_resources_dir()?;
    let bin_path = ensure_bin_path_exists()?;
    let nvmd_exe_source = res_dir.join("nvmd.exe");

    fs::copy(&nvmd_exe_source, bin_path.join("nvmd.exe"))?;
    for entry in fs::read_dir(&bin_path)? {
        let path = entry?.path();
        if path.extension().and_then(|ext| ext.to_str()) == Some("exe") {
            if let Some(file_name) = path.file_name() {
                fs::copy(&nvmd_exe_source, bin_path.join(file_name))?;
            } else {
                bail!("Failed to get file name for path: {:?}", path);
            }
        }
    }
    save_schema_version(CURRENT_MIGRATION_VERSION)?;
    Ok(())
}

#[cfg(unix)]
fn update_schema_to_last() -> Result<()> {
    let res_dir = dirs::app_resources_dir()?;
    let bin_path = ensure_bin_path_exists()?;

    fs::copy(res_dir.join("nvmd"), bin_path.join("nvmd"))?;
    save_schema_version(CURRENT_MIGRATION_VERSION)?;
    Ok(())
}

fn ensure_bin_path_exists() -> Result<std::path::PathBuf> {
    let bin_path = dirs::bin_path()?;
    if !bin_path.exists() {
        fs::create_dir_all(&bin_path)?;
    }
    Ok(bin_path)
}

fn save_schema_version(version: i16) -> Result<()> {
    help::save_string(&dirs::migration_path()?, &version.to_string())?;
    Ok(())
}

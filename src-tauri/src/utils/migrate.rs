use super::{dirs, help};
use crate::utils::logging::Type;
use crate::{core::handle, logging_error, process::AsyncHandler};
use anyhow::Result;
use tauri::Emitter;
use tokio::fs;
use tokio::time::{sleep, Duration};

const CURRENT_MIGRATION_VERSION: i16 = 29;
const NODE_DEFAULT_EXECUTE: [&str; 4] = ["node", "npm", "npx", "corepack"];

pub fn init() -> Result<()> {
    AsyncHandler::spawn(|| async {
        if let Err(err) = update_schema().await {
            logging_error!(Type::Migrate, true, "{}", err);

            // Delay 1s before sending events to the window
            sleep(Duration::from_secs(1)).await;
            if let Some(window) = handle::Handle::global().get_window() {
                let _ = window.emit("nvm-desktop://app-migration-error", ());
            }
        }
    });

    Ok(())
}

async fn update_schema() -> Result<()> {
    let schema_version = get_schema_version().unwrap_or_else(|err| {
        logging_error!(Type::Migrate, true, "{}", err);
        0 // default version 0
    });

    if schema_version < CURRENT_MIGRATION_VERSION {
        if schema_version == 0 {
            update_schema_from_basic().await?;
        }
        update_schema_to_last().await?;
    }

    Ok(())
}

/// get schema version
fn get_schema_version() -> Result<i16> {
    let version_str = dirs::migration_path().and_then(|path| help::read_string(&path))?;
    version_str.parse::<i16>().map_err(|e| e.into())
}

#[cfg(windows)]
async fn update_schema_from_basic() -> Result<()> {
    let res_dir = dirs::app_resources_dir()?;
    let bin_path = ensure_bin_path_exists().await?;
    let nvmd_exe_source = res_dir.join("nvmd.exe");
    let nvmd_cmd_source = res_dir.join("temp.cmd");

    fs::copy(&nvmd_exe_source, bin_path.join("nvmd.exe")).await?;
    for name in NODE_DEFAULT_EXECUTE {
        fs::copy(&nvmd_exe_source, bin_path.join(format!("{}.exe", name))).await?;
        if name != "node" {
            fs::copy(&nvmd_cmd_source, bin_path.join(format!("{}.cmd", name))).await?;
        }
    }
    save_schema_version(CURRENT_MIGRATION_VERSION).await?;
    Ok(())
}

#[cfg(unix)]
async fn update_schema_from_basic() -> Result<()> {
    use std::os::unix::fs::symlink;

    let res_dir = dirs::app_resources_dir()?;
    let bin_path = ensure_bin_path_exists().await?;
    let nvmd_exe_path = bin_path.join("nvmd");

    fs::copy(res_dir.join("nvmd"), &nvmd_exe_path).await?;
    for name in NODE_DEFAULT_EXECUTE {
        symlink(&nvmd_exe_path, bin_path.join(name))?;
    }
    save_schema_version(CURRENT_MIGRATION_VERSION).await?;
    Ok(())
}

#[cfg(windows)]
async fn update_schema_to_last() -> Result<()> {
    use anyhow::bail;

    let res_dir = dirs::app_resources_dir()?;
    let bin_path = ensure_bin_path_exists().await?;
    let nvmd_exe_source = res_dir.join("nvmd.exe");

    fs::copy(&nvmd_exe_source, bin_path.join("nvmd.exe")).await?;
    for entry in std::fs::read_dir(&bin_path)? {
        let path = entry?.path();
        if path.extension().and_then(|ext| ext.to_str()) == Some("exe") {
            if let Some(file_name) = path.file_name() {
                fs::copy(&nvmd_exe_source, bin_path.join(file_name)).await?;
            } else {
                bail!("Failed to get file name for path: {:?}", path);
            }
        }
    }
    save_schema_version(CURRENT_MIGRATION_VERSION).await?;
    Ok(())
}

#[cfg(unix)]
async fn update_schema_to_last() -> Result<()> {
    let res_dir = dirs::app_resources_dir()?;
    let bin_path = ensure_bin_path_exists().await?;

    fs::copy(res_dir.join("nvmd"), bin_path.join("nvmd")).await?;
    save_schema_version(CURRENT_MIGRATION_VERSION).await?;
    Ok(())
}

async fn ensure_bin_path_exists() -> Result<std::path::PathBuf> {
    let bin_path = dirs::bin_path()?;
    if !bin_path.exists() {
        fs::create_dir_all(&bin_path).await?;
    }
    Ok(bin_path)
}

async fn save_schema_version(version: i16) -> Result<()> {
    help::async_save_string(&dirs::migration_path()?, &version.to_string()).await?;
    Ok(())
}

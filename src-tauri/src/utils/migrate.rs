use super::{dirs, help};
use crate::utils::logging::Type;
use crate::{core::handle, logging_error, process::AsyncHandler};
use anyhow::Result;
use tauri::Emitter;
use tokio::fs;
use tokio::time::{Duration, sleep};

const CURRENT_MIGRATION_VERSION: i16 = 33;
const NODE_DEFAULT_EXECUTE: [&str; 4] = ["node", "npm", "npx", "corepack"];

pub fn init() {
    AsyncHandler::spawn(|| async {
        if let Err(err) = update_schema().await {
            logging_error!(Type::Migrate, true, "{}", err);

            // Delay 1s before sending events to the window
            sleep(Duration::from_secs(1)).await;
            if let Some(window) = handle::Handle::global().get_main_window() {
                let _ = window.emit("nvm-desktop://app-migration-error", ());
            }
        }
    });
}

async fn update_schema() -> Result<()> {
    let schema_version = get_schema_version().await.unwrap_or_else(|err| {
        logging_error!(Type::Migrate, true, "{}", err);
        0 // default version 0
    });

    if schema_version < CURRENT_MIGRATION_VERSION {
        if schema_version == 0 {
            update_schema_from_basic().await?;
        }
        update_schema_to_last().await?;

        // ⭐ macOS self-heal
        #[cfg(target_os = "macos")]
        if let Err(err) = self_heal().await {
            logging_error!(Type::Migrate, false, "self-heal failed: {}", err);
        }
    }

    Ok(())
}

/// get schema version
async fn get_schema_version() -> Result<i16> {
    let path = dirs::migration_path()?;
    let content = help::read_string(&path).await?;
    let version = content.trim().parse::<i16>()?;
    Ok(version)
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
    use tokio::fs::symlink;

    let res_dir = dirs::app_resources_dir()?;
    let bin_path = ensure_bin_path_exists().await?;
    let nvmd_exe_path = bin_path.join("nvmd");

    fs::copy(res_dir.join("nvmd"), &nvmd_exe_path).await?;
    for name in NODE_DEFAULT_EXECUTE {
        symlink(&nvmd_exe_path, bin_path.join(name)).await?;
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
    let target = bin_path.join("nvmd");

    fs::copy(res_dir.join("nvmd"), &target).await?;

    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = std::fs::metadata(&target)?.permissions();
        perms.set_mode(0o755);
        tokio::fs::set_permissions(&target, perms).await?;
    }

    save_schema_version(CURRENT_MIGRATION_VERSION).await?;
    Ok(())
}

async fn ensure_bin_path_exists() -> Result<std::path::PathBuf> {
    let bin_path = dirs::bin_path()?;
    if !fs::try_exists(&bin_path).await.unwrap_or(false) {
        fs::create_dir_all(&bin_path).await?;
    }
    Ok(bin_path)
}

async fn save_schema_version(version: i16) -> Result<()> {
    help::save_string(&dirs::migration_path()?, &version.to_string()).await?;
    Ok(())
}

#[cfg(target_os = "macos")]
async fn self_heal() -> Result<()> {
    use std::process::Command;

    let bin_path = dirs::bin_path()?; // ~/.nvmd/bin
    let nvmd_path = bin_path.join("nvmd");

    if !fs::try_exists(&nvmd_path).await.unwrap_or(false) {
        return Ok(()); // nothing to heal
    }

    // 1️⃣ remove quarantine
    let _ = Command::new("xattr")
        .args(["-d", "com.apple.quarantine", nvmd_path.to_str().unwrap()])
        .output();

    // 2️⃣ ad-hoc sign nvmd
    let _ = Command::new("codesign")
        .args([
            "--force",
            "--deep",
            "--sign",
            "-",
            nvmd_path.to_str().unwrap(),
        ])
        .output();

    Ok(())
}

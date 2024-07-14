use std::{
    path::PathBuf,
    sync::{Arc, Mutex},
    time::Duration,
};

use anyhow::{anyhow, bail, Context, Result};
use get_node::{
    archive::{fetch_native, FetchConfig},
    list::{version_list, ListConfig},
};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use tauri::Manager;
use tokio::{sync::watch, time::Instant};

use crate::{
    config::{Config, NVersion},
    utils::{dirs, help},
};

static CANCEL_SENDER: Lazy<Arc<Mutex<Option<watch::Sender<bool>>>>> =
    Lazy::new(|| Arc::new(Mutex::new(None)));

#[derive(Debug, Default, Clone, Deserialize, Serialize)]
pub struct ProgressData<'a> {
    pub source: &'a str,
    pub total: usize,
    pub transferred: usize,
}

/// Get the currently set node version
pub fn get_current(fetch: Option<bool>) -> Result<Option<String>> {
    let fetch = fetch.unwrap_or(false);
    if !fetch {
        return Ok(Config::node().latest().get_current());
    }

    let current = dirs::default_version_path()
        .and_then(|path| help::read_string(&path))
        .map(Some)
        .unwrap_or_else(|err| {
            log::error!(target: "app", "{err}");
            None
        });

    Config::node().apply();
    Config::node().data().update_current(current.clone())?;

    Ok(current)
}

/// Set the current node version
pub async fn set_current(version: Option<String>) -> Result<()> {
    let version: String = version.unwrap_or(String::new());
    let default_path = dirs::default_version_path()?;
    help::save_string(&default_path, &version).await?;

    // update `current`
    Config::node().apply();
    Config::node().data().update_current(Some(version))?;

    Ok(())
}

/// fetch version list data from remote or local
/// remote when fetch is `true`
/// local when fetch is `false`
pub async fn get_version_list(fetch: Option<bool>) -> Result<Option<Vec<NVersion>>> {
    let fetch = fetch.unwrap_or(false);
    if !fetch {
        // return existing data directly
        return Ok(Config::node().latest().get_list());
    }

    let settings = Config::settings().data().clone();

    // fetch list data from remotefetch data from remote
    let list = version_list::<Vec<NVersion>>(ListConfig {
        mirror: settings.mirror,
        proxy: settings.proxy,
        no_proxy: settings.no_proxy,
        timeout: None,
    })
    .await?;

    // update list
    Config::node().apply();
    Config::node().data().update_list(&list)?;

    Ok(Some(list))
}

/// get node installed list
pub async fn get_installed_list(fetch: Option<bool>) -> Result<Option<Vec<String>>> {
    let fetch = fetch.unwrap_or(false);
    if !fetch {
        return Ok(Config::node().latest().get_installed());
    }

    let directory: Option<String> = Config::settings().data().get_directory();
    if directory.is_none() {
        bail!("directory should not be null");
    }

    let directory = PathBuf::from(directory.unwrap());
    if !directory.exists() {
        return Ok(Some(vec![]));
    }

    let mut versions = vec![];
    let mut entries = tokio::fs::read_dir(&directory).await?;
    while let Some(entry) = entries.next_entry().await? {
        let version = entry.file_name().to_string_lossy().to_string();
        let node_path = directory.clone();
        #[cfg(target_os = "windows")]
        let node_path = node_path.join(&version).join("node.exe");
        #[cfg(any(target_os = "macos", target_os = "linux"))]
        let node_path = node_path.join(&version).join("bin/node");
        if node_path.exists() {
            versions.push(version);
        }
    }

    // update installed
    Config::node().apply();
    Config::node().data().update_installed(&versions)?;

    Ok(Some(versions))
}

/// install node
pub async fn install_node(
    window: tauri::Window,
    version: Option<String>,
    arch: Option<String>,
) -> Result<String> {
    if version.is_none() {
        bail!("version should not be null");
    }

    let version: String = version.unwrap();
    let settings = Config::settings().latest().clone();
    let mirror = settings.mirror.unwrap();
    let directory = settings.directory.unwrap();

    let last_emit_time = Arc::new(Mutex::new(Instant::now()));

    let (cancel_sender, cancel_receiver) = watch::channel(false);
    {
        let mut sender_lock = CANCEL_SENDER.lock().unwrap();
        *sender_lock = Some(cancel_sender);
    }

    let config = FetchConfig {
        dest: directory,
        mirror: mirror,
        arch,
        version: version,
        no_proxy: settings.no_proxy,
        proxy: settings.proxy,
        cancel_signal: Some(cancel_receiver),
        timeout: None,
        on_progress: Box::new({
            move |source: &str, transferred: usize, total: usize| {
                let mut last_emit_time = last_emit_time.lock().unwrap();
                let now = Instant::now();
                if now.duration_since(*last_emit_time) >= Duration::from_millis(300) {
                    *last_emit_time = now;
                    let _ = window.emit(
                        "on-node-progress",
                        ProgressData {
                            source,
                            transferred,
                            total,
                        },
                    );
                }
            }
        }),
    };

    fetch_native(config).await
}

/// cancel install node
pub async fn install_node_cancel() -> Result<()> {
    if let Some(sender) = CANCEL_SENDER
        .lock()
        .map_err(|err| anyhow!(err.to_string()))?
        .as_ref()
    {
        let _ = sender.send(true);
    }
    Ok(())
}

/// uninstall node
pub async fn uninstall_node(version: String, current: Option<bool>) -> Result<()> {
    let directory: Option<String> = Config::settings().data().get_directory();
    if let Some(directory) = directory {
        let current = current.unwrap_or(false);
        let directory = PathBuf::from(directory).join(&version);

        let remove_version = async {
            tokio::fs::remove_dir_all(&directory).await.context(format!(
                "Failed to remove version directory: {:?}",
                directory
            ))
        };
        let remove_current = async {
            if current {
                let default_path = dirs::default_version_path()?;
                tokio::fs::remove_dir_all(&default_path)
                    .await
                    .context(format!(
                        "Failed to remove the default file: {:?}",
                        default_path
                    ))
            } else {
                Ok(())
            }
        };

        let (r_version, r_current) = tokio::join!(remove_version, remove_current);
        r_version?;
        r_current?;
    }

    Ok(())
}

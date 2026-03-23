use crate::{
    config::{Config, INode, NVersion, SharedDraft},
    core::handle,
    logging,
    process::AsyncHandler,
    utils::{help, logging::Type},
};
use anyhow::{anyhow, bail, Context, Result};
use get_node::{
    archive::{fetch_native, FetchConfig},
    list::{version_list, ListConfig},
};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::{
    cmp::Ordering,
    path::PathBuf,
    sync::{Arc, Mutex},
    time::Duration,
};
use tauri::Emitter;
use tokio::{sync::watch, time::Instant};
use version_compare::{compare, Cmp};

static CANCEL_SENDER: Lazy<Arc<Mutex<Option<watch::Sender<bool>>>>> =
    Lazy::new(|| Arc::new(Mutex::new(None)));

#[derive(Debug, Default, Clone, Deserialize, Serialize)]
pub struct ProgressData<'a> {
    pub source: &'a str,
    pub total: usize,
    pub transferred: usize,
}

pub async fn fetch_nodes() -> Result<SharedDraft<INode>> {
    let draft = Config::node().await;
    let data = draft.data_arc();
    Ok(data)
}

pub async fn fetch_installed() -> Result<Option<Vec<String>>> {
    Ok(fetch_nodes().await?.get_installed())
}

pub async fn fetch_installed_with_sync(
    need_refresh_tray: Option<bool>,
) -> Result<Option<Vec<String>>> {
    let draft = Config::settings().await.data_arc();
    let dir = draft.get_directory();

    let versions = sync_installed(dir).await?;

    let need_refresh_tray = need_refresh_tray.unwrap_or(false);
    if need_refresh_tray {
        AsyncHandler::spawn(|| async {
            let _ = super::tray::Tray::global().update_part().await;
        });
    }

    Ok(versions)
}

pub async fn get_current() -> Result<Option<String>> {
    Ok(fetch_nodes().await?.get_current())
}

pub async fn get_current_with_sync() -> Result<Option<String>> {
    let current = help::read_current().await?;
    Config::node()
        .await
        .edit_draft(|d| d.update_current(current));

    Config::node().await.apply();
    Ok(Config::node().await.data_arc().get_current())
}

/// Set the current node version
pub async fn set_current(version: Option<String>) -> Result<()> {
    Config::node().await.edit_draft(|d| {
        d.update_current(version.clone());
    });

    let process_result: std::result::Result<(), anyhow::Error> = {
        help::write_current(&version).await?;
        super::tray::Tray::global().update_part().await?;
        Ok(())
    };

    if let Err(err) = process_result {
        Config::node().await.discard();
        return Err(err);
    }
    Config::node().await.apply();

    Ok(())
}

/// update current version from menu
pub async fn update_current_from_menu(version: Option<String>) -> Result<()> {
    Config::node().await.edit_draft(|d| {
        d.update_current(version.clone());
    });

    let process_result: std::result::Result<(), anyhow::Error> = {
        handle::Handle::update_tray_part_and_emit(
            "nvm-desktop://refresh-version-info",
            &version.unwrap_or_default(),
        )
        .await?;
        Ok(())
    };

    if let Err(err) = process_result {
        Config::node().await.discard();
        return Err(err);
    }
    Config::node().await.apply();

    Ok(())
}

/// get version list data from local
pub async fn get_version_list() -> Result<Option<Vec<NVersion>>> {
    Ok(fetch_nodes().await?.get_list())
}

/// get version list data from remote
pub async fn get_version_list_with_sync() -> Result<Option<Vec<NVersion>>> {
    let settings = Config::settings().await.data_arc();
    // fetch list data from remote
    let list = version_list::<Vec<NVersion>>(ListConfig {
        mirror: settings.mirror.clone(),
        proxy: settings.proxy.clone(),
        no_proxy: settings.no_proxy,
        connect_timeout: None,
        read_timeout: None,
    })
    .await?;

    Config::node().await.edit_draft(|d| d.update_list(list));

    Config::node().await.apply();
    let node_data = Config::node().await.data_arc();
    logging!(debug, Type::Setup, "Saving Node data to file...");
    node_data.save_file().await?;

    Ok(node_data.get_list())
}

pub async fn sync_installed(path: Option<String>) -> Result<Option<Vec<String>>> {
    let new_installed = match path {
        Some(p) => read_installed(&p).await?,
        _ => vec![],
    };
    Config::node()
        .await
        .edit_draft(|d| d.update_installed(new_installed));

    Config::node().await.apply();
    let node_data = Config::node().await.data_arc();
    Ok(node_data.get_installed())
}

/// read node installed version list
pub async fn read_installed(path: &str) -> Result<Vec<String>> {
    let directory = PathBuf::from(path);
    if !tokio::fs::try_exists(&directory).await.unwrap_or(false) {
        logging!(
            error,
            Type::Config,
            "file not found \"{}\"",
            directory.display()
        );
        return Ok(vec![]);
    }

    let mut versions = vec![];
    let mut entries = tokio::fs::read_dir(&directory).await?;
    while let Some(entry) = entries.next_entry().await? {
        let version = entry.file_name().to_string_lossy().into_owned();
        let node_path = {
            #[cfg(target_os = "windows")]
            {
                directory.join(&version).join("node.exe")
            }
            #[cfg(any(target_os = "macos", target_os = "linux"))]
            {
                directory.join(&version).join("bin/node")
            }
        };
        if tokio::fs::try_exists(&node_path).await.unwrap_or(false) {
            versions.push(version);
        }
    }

    versions.sort_by(|a, b| match compare(b, a) {
        Ok(Cmp::Lt) => Ordering::Less,
        Ok(Cmp::Eq) => Ordering::Equal,
        Ok(Cmp::Gt) => Ordering::Greater,
        _ => unreachable!(),
    });

    Ok(versions)
}

/// install node
pub async fn install_node(
    window: tauri::Window,
    version: Option<String>,
    arch: Option<String>,
) -> Result<String> {
    let Some(version) = version else {
        bail!("version should not be null");
    };

    let settings = Config::settings().await.data_arc();
    let Some(directory) = settings.get_directory() else {
        bail!("directory should not be null");
    };
    let Some(mirror) = settings.mirror.clone() else {
        bail!("mirror should not be null");
    };

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
        proxy: settings.proxy.clone(),
        cancel_signal: Some(cancel_receiver),
        connect_timeout: None,
        read_timeout: None,
        on_progress: Box::new({
            move |source: &str, transferred: usize, total: usize| {
                let mut last_emit_time = last_emit_time.lock().unwrap();
                let now = Instant::now();
                if now.duration_since(*last_emit_time) >= Duration::from_millis(300) {
                    *last_emit_time = now;
                    let _ = window.emit(
                        "nvm-desktop://node-download-progress",
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
pub async fn uninstall_node(version: String) -> Result<()> {
    let draft = Config::settings().await.data_arc();
    let directory = draft.get_directory();
    let Some(directory) = directory else {
        return Ok(());
    };

    let node_dir = PathBuf::from(directory).join(version);
    if !tokio::fs::try_exists(&node_dir).await.unwrap_or(false) {
        return Ok(());
    }
    tokio::fs::remove_dir_all(&node_dir)
        .await
        .with_context(|| format!("Failed to remove version directory: {}", node_dir.display()))?;

    Ok(())
}

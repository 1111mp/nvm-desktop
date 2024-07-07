use anyhow::{bail, Result};
use get_node::list::{version_list, ListConfig};
use std::path::PathBuf;
use tokio::fs;

use crate::config::{Config, NVersion};

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
    let mut entries = fs::read_dir(&directory).await?;
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

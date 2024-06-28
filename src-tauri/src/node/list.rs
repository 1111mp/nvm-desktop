use std::{path::PathBuf, time::Duration};

use anyhow::{bail, Result};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tokio::fs;

use crate::config::Config;

#[derive(Default, Debug, Clone, Deserialize, Serialize)]
pub struct NVersion {
    /// version release date
    pub date: String,

    /// long time support version
    /// String or bool
    pub lts: Option<Value>,

    /// openssl version
    pub openssl: Option<String>,

    /// npm version
    pub npm: Option<String>,

    /// v8 engine version
    pub v8: String,

    /// node version
    pub version: String,

    /// the downloadbable files with types
    pub files: Vec<String>,
}

#[derive(Debug, Default, Clone, Deserialize, Serialize)]
pub struct ListParams {
    /// fetch from remote
    pub fetch: Option<bool>,

    /// timeout
    pub timeout: Option<Duration>,
}

/// fetch version list data from remote or local
/// remote when fetch is `true`
/// local when fetch is `false`
pub async fn read_version_list(params: &ListParams) -> Result<Option<Vec<NVersion>>> {
    let fetch = params.fetch.unwrap_or(false);
    if !fetch {
        // return existing data directly
        return Ok(Config::node().latest().get_list());
    }

    let mirror = Config::settings().data().get_mirror();
    if mirror.is_none() {
        bail!("mirror should not be null");
    }

    let mirror = mirror.unwrap();
    // timeout default value is `20s`
    let timeout = params.timeout.unwrap_or(Duration::from_millis(20000));
    let proxy = Config::settings().data().get_proxy();
    // fetch list data from remotefetch data from remote
    let list = if let Some(proxy) = proxy {
        // proxy by user set
        // need with proxy
        let mut builder = reqwest::ClientBuilder::new().use_rustls_tls().no_proxy();
        let proxy_scheme = format!("http://{}:{}", proxy.ip, proxy.port);
        if let Ok(proxy) = reqwest::Proxy::http(&proxy_scheme) {
            builder = builder.proxy(proxy);
        }
        if let Ok(proxy) = reqwest::Proxy::https(&proxy_scheme) {
            builder = builder.proxy(proxy);
        }
        if let Ok(proxy) = reqwest::Proxy::all(&proxy_scheme) {
            builder = builder.proxy(proxy);
        }

        builder
            // timeout 20s
            .timeout(timeout)
            .build()?
            .get(format!("{}/index.json", &mirror))
            .send()
            .await?
            .json::<Vec<NVersion>>()
            .await?
    } else {
        let builder = if Config::settings().data().no_proxy.unwrap_or(false) {
            // disabled proxy
            // it's not work when `TUN` proxy mode on
            reqwest::ClientBuilder::new().use_rustls_tls().no_proxy()
        } else {
            // system proxy will be work
            reqwest::ClientBuilder::new().use_rustls_tls()
        };

        builder
            // timeout 20s
            .timeout(timeout)
            .build()?
            .get(format!("{}/index.json", &mirror))
            .send()
            .await?
            .json::<Vec<NVersion>>()
            .await?
    };

    // update list
    Config::node().data().update_list(&list)?;

    Ok(Some(list))
}

/// read node installed list
pub async fn read_installed_list(fetch: Option<bool>) -> Result<Option<Vec<String>>> {
    let fetch = fetch.unwrap_or(false);
    if !fetch {
        return Ok(Config::node().data().get_installed());
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
        let _ = node_path.join(&version).join("node.exe");
        #[cfg(any(target_os = "macos", target_os = "linux"))]
        node_path.join("bin/node");
        if node_path.exists() {
            versions.push(version);
        }
    }

    // update installed
    Config::node().data().update_installed(&versions)?;

    Ok(Some(versions))
}

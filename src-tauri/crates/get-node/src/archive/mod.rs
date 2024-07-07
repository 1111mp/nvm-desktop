mod tarball;
mod zip;

use super::{node, Proxy};
use anyhow::Result;
use std::{path::PathBuf, time::Duration};

/// get progress
/// source: &str (`download` & `unzip`)
/// completed size
/// total size
pub type OnProgress = dyn Fn(&str, usize, usize) + Send + Sync;

pub struct FetchConfig {
    /// output dir
    pub dest: String,

    /// fetch mirror url
    pub mirror: String,

    /// node version
    pub version: String,

    // system arch
    pub arch: Option<String>,

    /// proxy ip & port
    pub proxy: Option<Proxy>,

    /// disable proxy
    pub no_proxy: Option<bool>,

    /// timeout
    pub timeout: Option<Duration>,

    /// to cancel fetch
    pub cancel_signal: Option<tokio::sync::watch::Receiver<bool>>,

    /// progress callback
    pub on_progress: Box<OnProgress>,
}

fn create_client(
    proxy: Option<Proxy>,
    no_proxy: Option<bool>,
    timeout: Duration,
) -> Result<reqwest::Client> {
    let builder = match no_proxy {
        // disabled proxy
        // it's not work when `TUN` proxy mode on
        Some(_) => reqwest::ClientBuilder::new().use_rustls_tls().no_proxy(),
        None => match proxy {
            // proxy by user set
            // need with proxy
            Some(proxy) => {
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
            }
            // system proxy will be work
            None => reqwest::ClientBuilder::new().use_rustls_tls(),
        },
    };
    Ok(builder.timeout(timeout).build()?)
}

async fn send(
    client: &reqwest::Client,
    url: &str,
    cancel_signal: Option<&mut tokio::sync::watch::Receiver<bool>>,
) -> Result<reqwest::Response> {
    match cancel_signal {
        Some(cancel_receiver) => {
            tokio::select! {
                response = client.get(url).send() => {
                    response.map_err(Into::into)
                },
                _ = cancel_receiver.changed() => {
                    anyhow::bail!("Download was cancelled");
                }
            }
        }
        None => client.get(url).send().await.map_err(Into::into),
    }
}

cfg_if::cfg_if! {
    if #[cfg(unix)] {
        /// Fetch a remote archive in the native OS-preferred format from the specified
        /// URL and store its results at the specified file path.
        ///
        /// On Windows, the preferred format is zip. On Unixes, the preferred format
        /// is tarball.
        pub async fn fetch_native(config: FetchConfig) -> Result<String> {
            tarball::fetch(config).await
        }
    } else if #[cfg(windows)] {
        /// Fetch a remote archive in the native OS-preferred format from the specified
        /// URL and store its results at the specified file path.
        ///
        /// On Windows, the preferred format is zip. On Unixes, the preferred format
        /// is tarball.
        pub async fn fetch_native(config: FetchConfig) -> Result<String> {
            zip::fetch(config).await
        }
    } else {
        compile_error!("Unsupported OS (expected 'unix' or 'windows').");
    }
}

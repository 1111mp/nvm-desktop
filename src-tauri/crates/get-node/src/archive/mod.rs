mod tarball;
mod zip;

use super::{node, Proxy};
use anyhow::Result;
use futures_util::StreamExt;
use reqwest::{header, StatusCode};
use std::{path::Path, time::Duration};
use tokio::{fs::OpenOptions, io::AsyncWriteExt};

/// get progress
/// source: &str (`download` & `unzip`)
/// completed size
/// total size
pub type OnProgress = dyn Fn(&str, usize, usize) + Send + Sync;

const DOWNLOAD_MAX_RETRIES: usize = 3;
const DOWNLOAD_RETRY_DELAY_MS: u64 = 800;

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

    /// connection timeout (default: 30s)
    /// only affects the time to establish a connection, not the download time
    pub connect_timeout: Option<Duration>,

    /// read timeout (default: 60s)
    pub read_timeout: Option<Duration>,

    /// to cancel fetch
    pub cancel_signal: Option<tokio::sync::watch::Receiver<bool>>,

    /// progress callback
    pub on_progress: Box<OnProgress>,
}

fn create_client(
    proxy: Option<Proxy>,
    no_proxy: Option<bool>,
    connect_timeout: Duration,
    read_timeout: Duration,
) -> Result<reqwest::Client> {
    let mut builder = reqwest::ClientBuilder::new()
        .use_rustls_tls()
        .connect_timeout(connect_timeout)
        .read_timeout(read_timeout);
    if let Some(true) = no_proxy {
        builder = builder.no_proxy();
    } else if let Some(proxy) = proxy {
        if proxy.enabled {
            builder = builder.no_proxy();
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
        }
    }

    Ok(builder.build()?)
}

async fn send(
    client: &reqwest::Client,
    url: &str,
    start_from: u64,
    cancel_signal: Option<&mut tokio::sync::watch::Receiver<bool>>,
) -> Result<reqwest::Response> {
    let mut req = client.get(url);
    if start_from > 0 {
        req = req.header(header::RANGE, format!("bytes={start_from}-"));
    }

    match cancel_signal {
        Some(cancel_receiver) => {
            tokio::select! {
                response = req.send() => {
                    response.map_err(Into::into)
                },
                _ = cancel_receiver.changed() => {
                    anyhow::bail!("Download was cancelled");
                }
            }
        }
        None => req.send().await.map_err(Into::into),
    }
}

fn parse_total_size(response: &reqwest::Response, start_from: u64) -> u64 {
    if let Some(content_range) = response.headers().get(header::CONTENT_RANGE) {
        if let Ok(content_range) = content_range.to_str() {
            if let Some(total) = content_range.split('/').next_back() {
                if let Ok(total) = total.parse::<u64>() {
                    return total;
                }
            }
        }
    }

    response
        .content_length()
        .map(|len| len.saturating_add(start_from))
        .unwrap_or_default()
}

pub(super) async fn download_archive(
    client: &reqwest::Client,
    url: &str,
    temp_file_path: &Path,
    mut cancel_signal: Option<&mut tokio::sync::watch::Receiver<bool>>,
    on_progress: &OnProgress,
) -> Result<()> {
    let mut attempt = 0;

    loop {
        let mut downloaded_size = match tokio::fs::metadata(temp_file_path).await {
            Ok(meta) => meta.len(),
            Err(_) => 0,
        };

        let response = match send(client, url, downloaded_size, cancel_signal.as_deref_mut()).await
        {
            Ok(response) => response,
            Err(_err) if attempt < DOWNLOAD_MAX_RETRIES => {
                attempt += 1;
                tokio::time::sleep(Duration::from_millis(DOWNLOAD_RETRY_DELAY_MS)).await;
                continue;
            }
            Err(err) => return Err(err),
        };

        let status = response.status();
        if status == StatusCode::RANGE_NOT_SATISFIABLE {
            let _ = tokio::fs::remove_file(temp_file_path).await;
            downloaded_size = 0;
        } else if status == StatusCode::OK {
            if downloaded_size > 0 {
                downloaded_size = 0;
                let _ = tokio::fs::remove_file(temp_file_path).await;
            }
        } else if !(status.is_success()
            && (downloaded_size == 0 || status == StatusCode::PARTIAL_CONTENT))
        {
            if attempt < DOWNLOAD_MAX_RETRIES {
                attempt += 1;
                tokio::time::sleep(Duration::from_millis(DOWNLOAD_RETRY_DELAY_MS)).await;
                continue;
            }
            anyhow::bail!("HTTP failure ({status})");
        }

        let total_size = parse_total_size(&response, downloaded_size);
        let mut temp_file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(temp_file_path)
            .await?;
        let mut stream = response.bytes_stream();

        let mut stream_failed = None;

        while let Some(chunk) = match cancel_signal.as_deref_mut() {
            Some(cancel_receiver) => {
                tokio::select! {
                    chunk = stream.next() => {
                        chunk
                    },
                    _ = cancel_receiver.changed() => {
                        anyhow::bail!("Download was cancelled");
                    }
                }
            }
            None => stream.next().await,
        } {
            match chunk {
                Ok(chunk) => {
                    downloaded_size += chunk.len() as u64;
                    temp_file.write_all(&chunk).await?;
                    on_progress(
                        "download",
                        downloaded_size as usize,
                        std::cmp::max(total_size, downloaded_size) as usize,
                    );
                }
                Err(err) => {
                    stream_failed = Some(err);
                    break;
                }
            }
        }

        temp_file.sync_all().await?;

        if stream_failed.is_none() {
            return Ok(());
        }

        if attempt < DOWNLOAD_MAX_RETRIES {
            attempt += 1;
            tokio::time::sleep(Duration::from_millis(DOWNLOAD_RETRY_DELAY_MS)).await;
            continue;
        }

        if let Some(err) = stream_failed {
            return Err(err.into());
        }
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

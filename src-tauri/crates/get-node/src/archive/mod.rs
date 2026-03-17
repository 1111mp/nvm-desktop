mod tarball;
mod zip;

use super::{node, Proxy};
use anyhow::Result;
use futures_util::StreamExt;
use reqwest::{header, StatusCode};
use sha2::{Digest, Sha256};
use std::{
    path::{Path, PathBuf},
    time::{Duration, SystemTime},
};
use tokio::{
    fs::{File, OpenOptions},
    io::{AsyncReadExt, AsyncWriteExt},
};

/// get progress
/// source: &str (`download` & `unzip`)
/// completed size
/// total size
pub type OnProgress = dyn Fn(&str, usize, usize) + Send + Sync;

const DOWNLOAD_MAX_RETRIES: usize = 3;
const DOWNLOAD_RETRY_DELAY_MS: u64 = 800;
const NODE_SHASUMS_FILE: &str = "SHASUMS256.txt";
const STALE_PARTIAL_MAX_AGE: Duration = Duration::from_secs(60 * 60 * 24 * 7);

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

fn is_cancelled(cancel_signal: Option<&tokio::sync::watch::Receiver<bool>>) -> bool {
    match cancel_signal {
        Some(cancel_receiver) => *cancel_receiver.borrow(),
        None => false,
    }
}

pub(super) fn ensure_not_cancelled(
    cancel_signal: Option<&tokio::sync::watch::Receiver<bool>>,
) -> Result<()> {
    if is_cancelled(cancel_signal) {
        anyhow::bail!("Download was cancelled");
    }

    Ok(())
}

async fn send(
    client: &reqwest::Client,
    url: &str,
    start_from: u64,
    cancel_signal: Option<&mut tokio::sync::watch::Receiver<bool>>,
) -> Result<reqwest::Response> {
    ensure_not_cancelled(cancel_signal.as_deref())?;

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

pub(super) fn get_temp_archive_path(dest: &Path, archive_name: &str) -> PathBuf {
    dest.join(archive_name)
}

fn is_partial_archive_file(file_name: &str) -> bool {
    file_name.starts_with("node-v")
        && (file_name.ends_with(".zip") || file_name.ends_with(".tar.gz"))
}

pub(super) async fn cleanup_stale_partial_archives(dest: &Path, active_file: &Path) -> Result<()> {
    let mut entries = match tokio::fs::read_dir(dest).await {
        Ok(entries) => entries,
        Err(_) => return Ok(()),
    };

    while let Ok(Some(entry)) = entries.next_entry().await {
        let path = entry.path();
        if path == active_file {
            continue;
        }

        match path.file_name().and_then(|n| n.to_str()) {
            Some(name) if is_partial_archive_file(name) => name,
            _ => continue,
        };

        let metadata = match entry.metadata().await {
            Ok(metadata) if metadata.is_file() => metadata,
            _ => continue,
        };

        let modified = match metadata.modified() {
            Ok(modified) => modified,
            Err(_) => continue,
        };

        let age = match SystemTime::now().duration_since(modified) {
            Ok(age) => age,
            Err(_) => continue,
        };

        if age > STALE_PARTIAL_MAX_AGE {
            let _ = tokio::fs::remove_file(&path).await;
        }
    }

    Ok(())
}

async fn fetch_shasums(
    client: &reqwest::Client,
    shasums_url: &str,
    mut cancel_signal: Option<&mut tokio::sync::watch::Receiver<bool>>,
) -> Result<String> {
    let mut attempt = 0;

    loop {
        ensure_not_cancelled(cancel_signal.as_deref())?;

        let response = match send(client, shasums_url, 0, cancel_signal.as_deref_mut()).await {
            Ok(response) => response,
            Err(_err) if attempt < DOWNLOAD_MAX_RETRIES => {
                attempt += 1;
                tokio::time::sleep(Duration::from_millis(DOWNLOAD_RETRY_DELAY_MS)).await;
                continue;
            }
            Err(err) => return Err(err),
        };

        if !response.status().is_success() {
            if attempt < DOWNLOAD_MAX_RETRIES {
                attempt += 1;
                tokio::time::sleep(Duration::from_millis(DOWNLOAD_RETRY_DELAY_MS)).await;
                continue;
            }
            anyhow::bail!(
                "HTTP failure when fetching SHASUMS256.txt ({})",
                response.status()
            );
        }

        return response.text().await.map_err(Into::into);
    }
}

fn parse_expected_sha256(shasums: &str, archive_name: &str) -> Result<String> {
    for line in shasums.lines() {
        let mut parts = line.split_whitespace();
        let hash = match parts.next() {
            Some(hash) => hash,
            None => continue,
        };
        let file = match parts.next() {
            Some(file) => file.trim_start_matches('*'),
            None => continue,
        };

        if file == archive_name {
            return Ok(hash.to_lowercase());
        }
    }

    anyhow::bail!("Checksum for archive `{archive_name}` not found in SHASUMS256.txt")
}

async fn sha256_file(file_path: &Path) -> Result<String> {
    let mut hasher = Sha256::new();
    let mut file = File::open(file_path).await?;
    let mut buffer = [0_u8; 8192];

    loop {
        let read = file.read(&mut buffer).await?;
        if read == 0 {
            break;
        }
        hasher.update(&buffer[..read]);
    }

    Ok(format!("{:x}", hasher.finalize()))
}

pub(super) async fn verify_archive_checksum(
    client: &reqwest::Client,
    mirror: &str,
    version: &str,
    archive_name: &str,
    archive_path: &Path,
    mut cancel_signal: Option<&mut tokio::sync::watch::Receiver<bool>>,
) -> Result<()> {
    ensure_not_cancelled(cancel_signal.as_deref())?;

    let shasums_url = format!(
        "{}/v{}/{}",
        mirror.trim_end_matches('/'),
        version,
        NODE_SHASUMS_FILE
    );

    let shasums = fetch_shasums(client, &shasums_url, cancel_signal.as_deref_mut()).await?;
    let expected = parse_expected_sha256(&shasums, archive_name)?;
    ensure_not_cancelled(cancel_signal.as_deref())?;
    let actual = sha256_file(archive_path).await?;
    ensure_not_cancelled(cancel_signal.as_deref())?;

    if expected != actual {
        let _ = tokio::fs::remove_file(archive_path).await;
        anyhow::bail!("Checksum mismatch for {archive_name}: expected {expected}, got {actual}");
    }

    Ok(())
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
        ensure_not_cancelled(cancel_signal.as_deref())?;

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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_expected_sha256_finds_target_file() {
        let content = "aaaa  node-v20.0.0-linux-x64.tar.gz
bbbb  node-v20.0.0-win-x64.zip
";
        let hash = parse_expected_sha256(content, "node-v20.0.0-win-x64.zip").unwrap();
        assert_eq!(hash, "bbbb");
    }

    #[test]
    fn parse_expected_sha256_supports_star_prefix() {
        let content = "cccc *node-v20.0.0-linux-x64.tar.gz
";
        let hash = parse_expected_sha256(content, "node-v20.0.0-linux-x64.tar.gz").unwrap();
        assert_eq!(hash, "cccc");
    }

    #[test]
    fn parse_expected_sha256_returns_error_when_missing() {
        let content = "dddd  node-v20.0.0-linux-x64.tar.gz
";
        assert!(parse_expected_sha256(content, "missing.tar.gz").is_err());
    }
}

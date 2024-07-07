use anyhow::{bail, Result};
use async_compression::tokio::bufread::GzipDecoder;
use futures_util::StreamExt;
use node_semver::Version;
use std::{path::PathBuf, time::Duration};
use tokio::{
    fs::{remove_file, rename, File},
    io::{AsyncWriteExt, BufReader},
};
use tokio_tar::Archive;

use super::{create_client, node::*, send, FetchConfig};

pub async fn fetch(config: FetchConfig) -> Result<String> {
    let FetchConfig {
        dest,
        mirror,
        arch,
        version,
        proxy,
        no_proxy,
        timeout,
        mut cancel_signal,
        on_progress,
    } = config;

    let (name, full_name) = Node::archive_filename(&Version::parse(&version)?, arch);
    let url = format!("{}/v{}/{}", mirror, &version, &full_name);
    // timeout default value is `20s`
    let timeout = timeout.unwrap_or(Duration::from_millis(20000));
    let client = create_client(proxy, no_proxy, timeout)?;

    let response = send(&client, &url, cancel_signal.as_mut()).await?;

    let status = response.status();
    if !status.is_success() {
        bail!(format!("HTTP failure ({status})"));
    }

    let total_size = response
        .content_length()
        .ok_or_else(|| anyhow::anyhow!("Failed to get content length"))?;
    let mut downloaded_size = 0;
    let dest = PathBuf::from(dest);
    let temp_file_path = dest.join(&full_name);

    // start to download file
    let mut temp_file = File::create(&temp_file_path).await?;
    let mut stream = response.bytes_stream();
    // write stream buffer to file
    while let Some(chunk) = match cancel_signal.as_mut() {
        Some(cancel_receiver) => {
            tokio::select! {
                chunk = stream.next() => {
                    chunk
                },
                _ = cancel_receiver.changed() => {
                    bail!("Download was cancelled");
                }
            }
        }
        None => stream.next().await,
    } {
        let chunk = chunk?;
        downloaded_size += chunk.len();
        temp_file.write_all(&chunk).await?;
        on_progress("download", downloaded_size as usize, total_size as usize);
    }
    temp_file.sync_all().await?;
    drop(temp_file);

    // Create a buffered reader for the compressed data
    let file = File::open(&temp_file_path).await?;
    let reader = BufReader::new(file);

    // Initialize the GzipDecoder
    let decoded = GzipDecoder::new(reader);
    // Initialize the tar archive with the decoded reader
    let mut tarball = Archive::new(decoded);

    // Unpack the tarball to the destination directory and report progress
    let mut entries: tokio_tar::Entries<GzipDecoder<BufReader<File>>> = tarball.entries()?;
    let mut unpacked_size = 0;

    while let Some(entry) = match cancel_signal.as_mut() {
        Some(cancel_receiver) => {
            tokio::select! {
                entry = entries.next() => {
                    entry
                },
                _ = cancel_receiver.changed() => {
                    bail!("Unzipping was cancelled");
                }
            }
        }
        None => entries.next().await,
    } {
        let mut entry = entry?;
        let entry_size = entry.header().size()?;
        entry.unpack_in(&dest).await?;
        unpacked_size += entry_size;

        //todo Get the total size of the decompressed file on a Unix system
        on_progress("unzip", unpacked_size as usize, unpacked_size as usize);
    }

    let (_rename_future, _remove_future) = tokio::join!(
        rename(dest.join(&name), dest.join(&version)),
        remove_file(temp_file_path)
    );

    let path = dest.join(&version).to_string_lossy().to_string();
    Ok(path)
}

use anyhow::{bail, Result};
use async_compression::tokio::bufread::GzipDecoder;
use futures_util::StreamExt;
use node_semver::Version;
use std::{path::PathBuf, time::Duration};
use tokio::{
    fs::{remove_dir_all, File},
    io::BufReader,
};
use tokio_tar::ArchiveBuilder;

use super::{
    cleanup_stale_partial_archives, create_client, download_archive, ensure_not_cancelled,
    finalize_extraction, get_temp_archive_path, node::*, verify_archive_checksum, FetchConfig,
};

pub async fn fetch(config: FetchConfig) -> Result<String> {
    let FetchConfig {
        dest,
        mirror,
        arch,
        version,
        proxy,
        no_proxy,
        connect_timeout,
        read_timeout,
        mut cancel_signal,
        on_progress,
    } = config;

    let (name, full_name) = Node::archive_filename(&Version::parse(&version)?, arch);
    let url = format!("{}/v{}/{}", mirror, &version, &full_name);
    // connect_timeout default value is `30s` for establishing connection
    let connect_timeout = connect_timeout.unwrap_or(Duration::from_secs(30));
    // read_timeout default value is `60s` for each read operation (detecting stalls during download)
    let read_timeout = read_timeout.unwrap_or(Duration::from_secs(60));

    let client = create_client(proxy, no_proxy, connect_timeout, read_timeout)?;

    let dest = PathBuf::from(dest);
    let temp_file_path = get_temp_archive_path(&dest, &full_name);

    cleanup_stale_partial_archives(&dest, &temp_file_path).await?;

    download_archive(
        &client,
        &url,
        &temp_file_path,
        cancel_signal.as_mut(),
        on_progress.as_ref(),
    )
    .await?;

    verify_archive_checksum(
        &client,
        &mirror,
        &version,
        &full_name,
        &temp_file_path,
        cancel_signal.as_mut(),
    )
    .await?;

    ensure_not_cancelled(cancel_signal.as_ref())?;

    // Create a buffered reader for the compressed data
    let file = File::open(&temp_file_path).await?;
    let reader = BufReader::new(file);
    // Initialize the GzipDecoder
    let decoded = GzipDecoder::new(reader);
    // Initialize the tar archive with the decoded reader
    let mut tarball = ArchiveBuilder::new(decoded)
        .set_preserve_permissions(true)
        .build();
    // Unpack the tarball to the destination directory and report progress
    let mut entries = tarball.entries()?;
    let mut unpacked_size = 0;

    while let Some(entry) = match cancel_signal.as_mut() {
        Some(cancel_receiver) => {
            if *cancel_receiver.borrow() {
                let _ = remove_dir_all(dest.join(&name)).await;
                bail!("Unzipping was cancelled");
            }

            tokio::select! {
                entry = entries.next() => {
                    entry
                },
                _ = cancel_receiver.changed() => {
                    let _ = remove_dir_all(dest.join(&name)).await;
                    bail!("Unzipping was cancelled");
                }
            }
        }
        None => entries.next().await,
    } {
        let mut entry = entry?;
        // `effective_size` includes PAX size overrides and is the public read API
        // provided by astral-tokio-tar 0.7.
        let entry_size = entry.effective_size();
        entry.unpack_in(&dest).await?;
        unpacked_size += entry_size;

        //todo Get the total size of the decompressed file on a Unix system
        on_progress("unzip", unpacked_size as usize, unpacked_size as usize);
    }

    drop(entries);
    drop(tarball);

    finalize_extraction(&dest.join(&name), &dest.join(&version), &temp_file_path).await
}

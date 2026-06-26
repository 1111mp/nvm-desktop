use std::{
    path::{Component, Path, PathBuf},
    time::Duration,
};

use anyhow::{anyhow, bail, Result};
use async_zip::base::read::seek::ZipFileReader;
use node_semver::Version;
use tokio::{
    fs::{create_dir_all, remove_dir_all, File, OpenOptions},
    io::BufReader,
};
use tokio_util::compat::{TokioAsyncReadCompatExt, TokioAsyncWriteCompatExt};
use futures_lite::AsyncWriteExt;

use super::{
    cleanup_stale_partial_archives, create_client, download_archive, ensure_not_cancelled,
    finalize_extraction, get_temp_archive_path, node::*, verify_archive_checksum, FetchConfig,
};

fn resolve_entry_path(dest: &Path, entry_name: &str) -> Result<PathBuf> {
    let entry_path = Path::new(entry_name);

    if entry_path.is_absolute()
        || entry_path.components().any(|component| {
            matches!(
                component,
                Component::ParentDir | Component::RootDir | Component::Prefix(_)
            )
        })
    {
        bail!("Illegal archive entry path: {entry_name}");
    }

    Ok(dest.join(entry_path))
}

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
    let archive = BufReader::new(file).compat();
    // Initialize the GzipDecoder
    let mut reader = ZipFileReader::new(archive).await?;
    // Unpack the tarball to the destination directory and report progress
    let total_entries = reader.file().entries().len();
    let mut is_cancel = false;
    for index in 0..total_entries {
        // Check for cancel signal
        if let Some(cancel_receiver) = cancel_signal.as_mut() {
            if *cancel_receiver.borrow() {
                is_cancel = true;
                break;
            }
        }

        let entry = reader
            .file()
            .entries()
            .get(index)
            .ok_or_else(|| anyhow!("Missing zip entry at index {index}"))?;
        let path = resolve_entry_path(&dest, entry.filename().as_str()?)?;
        // If the filename of the entry ends with '/', it is treated as a directory.
        // This is implemented by previous versions of this crate and the Python Standard Library.
        let entry_is_dir = entry.dir()?;
        let mut entry_reader = reader.reader_without_entry(index).await?;

        if entry_is_dir {
            // The directory may have been created if iteration is out of order.
            if !path.exists() {
                create_dir_all(&path).await?;
            }
        } else {
            // Creates parent directories. They may not exist if iteration is out of order
            // or the archive does not contain directory entries.
            if let Some(parent) = path.parent() {
                if !parent.is_dir() {
                    create_dir_all(parent).await?;
                }
            }
            let writer = OpenOptions::new()
                .write(true)
                .create_new(true)
                .open(&path)
                .await?;
            let mut writer = writer.compat_write();
            futures_lite::io::copy(&mut entry_reader, &mut writer).await?;
            writer.close().await?;
        }

        on_progress("unzip", index + 1, total_entries);
    }

    if is_cancel {
        let _ = remove_dir_all(dest.join(&name)).await;
        bail!("Unzipping was cancelled");
    }

    drop(reader);

    finalize_extraction(&dest.join(&name), &dest.join(&version), &temp_file_path).await
}

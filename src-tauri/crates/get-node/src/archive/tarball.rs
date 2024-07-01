use anyhow::{bail, Result};
use async_compression::tokio::bufread::GzipDecoder;
use futures_util::StreamExt;
use node_semver::Version;
use std::path::PathBuf;
use tokio::{
    fs::{remove_file, rename, File},
    io::{AsyncWriteExt, BufReader},
};
use tokio_tar::Archive;

use super::{node::*, OnProgress};

pub async fn fetch(
    mirror: &String,
    version: &String,
    dest: &String,
    on_progress: &OnProgress,
) -> Result<()> {
    let (name, full_name) = Node::archive_filename(&Version::parse(version)?);
    let url = format!("{}/v{}/{}", mirror, version, &full_name);
    println!("url: {}", &url);
    let response = reqwest::ClientBuilder::new()
        .use_rustls_tls()
        .build()?
        .get(url.as_str())
        .send()
        .await?;

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
    let mut temp_file = File::create(&temp_file_path).await?;
    let mut stream = response.bytes_stream();

    while let Some(chunk) = stream.next().await {
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

    while let Some(entry) = entries.next().await {
        let mut entry = entry?;
        let entry_size = entry.header().size()?;
        entry.unpack_in(&dest).await?;
        unpacked_size += entry_size;
        on_progress("unzip", unpacked_size as usize, unpacked_size as usize);
    }

    let (_rename_future, _remove_future) = tokio::join!(
        rename(dest.join(&name), dest.join(&version)),
        remove_file(temp_file_path)
    );

    Ok(())
}

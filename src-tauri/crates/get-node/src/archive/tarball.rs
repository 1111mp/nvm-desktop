use anyhow::{bail, Result};
use async_compression::tokio::bufread::GzipDecoder;
use async_tar::Archive;
use futures_util::StreamExt;
use std::path::PathBuf;
use tokio::{
    fs::File,
    io::{AsyncSeekExt, AsyncWriteExt, BufReader as AsyncBufReader},
};
use tokio_util::compat::TokioAsyncReadCompatExt;

use super::node::*;

#[derive(Debug, Default)]
pub struct Tarball<F>
where
    F: Fn(usize, usize) + Send + Sync + 'static,
{
    url: String,
    version: String,
    // cache_file: PathBuf,
    dest: PathBuf,
    on_progress: F,
}

impl<'a, F> Tarball<F>
where
    F: Fn(usize, usize) + Send + Sync + 'static,
{
    pub async fn fetch(&self) -> Result<()> {
        let response = reqwest::ClientBuilder::new()
            .use_rustls_tls()
            .build()?
            .get(self.url.as_str())
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
        let temp_file_path = self.archive_filename();
        let mut temp_file = File::create(&temp_file_path).await?;
        let mut stream = response.bytes_stream();

        while let Some(chunk) = stream.next().await {
            let chunk = chunk?;
            downloaded_size += chunk.len();
            temp_file.write_all(&chunk).await?;
            (self.on_progress)(downloaded_size as usize, total_size as usize);
        }
        temp_file.sync_all().await?;
        temp_file.seek(tokio::io::SeekFrom::Start(0)).await?;

        // Create a buffered reader for the compressed data
        let reader = AsyncBufReader::new(temp_file);

        // Initialize the GzipDecoder
        let decoded = GzipDecoder::new(reader).compat();
        // Initialize the tar archive with the decoded reader
        let mut tarball = Archive::new(decoded);
        // Unpack the tarball to the destination directory and report progress
        let mut entries = tarball.entries()?;
        let mut unpacked_size = 0;
        while let Some(entry) = entries.next().await {
            let mut entry = entry?;
            let entry_size = entry.header().size()?;
            entry.unpack_in(self.dest.as_path()).await?;
            unpacked_size += entry_size;
            (self.on_progress)(unpacked_size as usize, total_size as usize);
        }

        // Optionally, remove the temporary file after unpacking
        tokio::fs::remove_file(temp_file_path).await?;

        Ok(())
    }

    fn archive_filename(&self) -> String {
        format!("{}.{}", self.archive_basename(), NODE_DISTRO_EXTENSION)
    }

    #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
    fn archive_basename(&self) -> String {
        // Note: Node began shipping pre-built binaries for Apple Silicon with Major version 16
        // Prior to that, we need to fall back on the x64 binaries
        format!(
            "node-v{}-{}-{}",
            self.version, NODE_DISTRO_OS, NODE_DISTRO_ARCH
        )
    }
}

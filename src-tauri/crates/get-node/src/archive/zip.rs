use anyhow::{bail, Result};
use async_zip::tokio::read::seek::ZipFileReader;
use futures_util::StreamExt;
use node_semver::Version;
use tokio::{
    fs::{create_dir_all, remove_file, rename, File, OpenOptions},
    io::{AsyncWriteExt, BufReader},
};
use tokio_util::compat::TokioAsyncWriteCompatExt;

use super::{node::*, OnProgress, PathBuf};

pub async fn fetch(
    mirror: &String,
    version: &String,
    dest: &String,
    on_progress: &OnProgress,
) -> Result<()> {
    let (name, full_name) = Node::archive_filename(&Version::parse(version)?);
    let url = format!("{}/v{}/{}", mirror, version, &full_name);
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
        (on_progress)("download", downloaded_size as usize, total_size as usize);
    }
    temp_file.sync_all().await?;
    drop(temp_file);

    // Create a buffered reader for the compressed data
    let file = File::open(&temp_file_path).await?;
    let mut reader = BufReader::new(file);

    // Initialize the GzipDecoder
    let mut zip: async_zip::base::read::seek::ZipFileReader<
        tokio_util::compat::Compat<&mut BufReader<File>>,
    > = ZipFileReader::with_tokio(&mut reader).await?;
    // Unpack the tarball to the destination directory and report progress
    let total_entries = zip.file().entries().len();
    for index in 0..total_entries {
        let entry = zip.file().entries().get(index).unwrap();
        let path = dest.join(entry.filename().as_str()?);
        // If the filename of the entry ends with '/', it is treated as a directory.
        // This is implemented by previous versions of this crate and the Python Standard Library.
        // https://docs.rs/async_zip/0.0.8/src/async_zip/read/mod.rs.html#63-65
        // https://github.com/python/cpython/blob/820ef62833bd2d84a141adedd9a05998595d6b6d/Lib/zipfile.py#L528
        let entry_is_dir = entry.dir()?;
        let mut entry_reader = zip.reader_without_entry(index).await?;

        if entry_is_dir {
            // The directory may have been created if iteration is out of order.
            if !path.exists() {
                create_dir_all(&path).await?;
            }
        } else {
            // Creates parent directories. They may not exist if iteration is out of order
            // or the archive does not contain directory entries.
            let parent = path.parent().unwrap();
            if !parent.is_dir() {
                create_dir_all(parent).await?;
            }
            let writer = OpenOptions::new()
                .write(true)
                .create_new(true)
                .open(&path)
                .await?;
            futures_lite::io::copy(&mut entry_reader, &mut writer.compat_write()).await?;
        }

        on_progress("unzip", index + 1, total_entries);
    }

    let (_rename_future, _remove_future) = tokio::join!(
        rename(dest.join(&name), dest.join(&version)),
        remove_file(temp_file_path)
    );

    Ok(())
}

use super::dirs;
use crate::{logging, utils::logging::Type};
use anyhow::{Context, Result, bail};
use serde::{Serialize, de::DeserializeOwned};
use std::path::PathBuf;

pub async fn read_string(path: &PathBuf) -> Result<String> {
    tokio::fs::read_to_string(path)
        .await
        .with_context(|| format!("failed to read the file \"{}\"", path.display()))
}

pub async fn save_string(path: &PathBuf, content: &str) -> Result<()> {
    tokio::fs::write(path, content)
        .await
        .with_context(|| format!("failed to write the file \"{}\"", path.display()))
}

/// read data from json as struct T
pub async fn read_json<T: DeserializeOwned>(path: &PathBuf) -> Result<T> {
    if !tokio::fs::try_exists(path).await.unwrap_or(false) {
        bail!("file not found \"{}\"", path.display());
    }

    let json_str = tokio::fs::read_to_string(path).await?;

    serde_json::from_str::<T>(&json_str).with_context(|| {
        format!(
            "failed to read the file with json format \"{}\"",
            path.display()
        )
    })
}

/// save the data to the file
/// can set `prefix` string to add some comments
pub async fn save_json<T: Serialize + Sync>(
    path: &PathBuf,
    data: &T,
    prefix: Option<&str>,
) -> Result<()> {
    let data_str = serde_json::to_string(data)?;

    let json_str = match prefix {
        Some(prefix) => format!("{prefix}\n\n{data_str}"),
        None => data_str,
    };

    let path_str = path.as_os_str().to_string_lossy().to_string();
    tokio::fs::write(path, json_str.as_bytes())
        .await
        .with_context(|| format!("failed to save file \"{path_str}\""))
}

pub async fn read_current() -> Result<Option<String>> {
    let path = dirs::default_version_path()?;
    let result = read_string(&path).await;
    if let Err(err) = &result {
        logging!(error, Type::Config, "read_current failed: {err}");
    }

    Ok(result.ok())
}

pub async fn write_current(current: &Option<String>) -> Result<()> {
    let path = dirs::default_version_path()?;
    let content = current.as_deref().unwrap_or("");
    save_string(&path, content).await
}

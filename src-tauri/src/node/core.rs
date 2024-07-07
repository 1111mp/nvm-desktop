use std::path::PathBuf;

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use tokio::fs;

use crate::{config::Config, utils::dirs::default_version_path};

#[derive(Debug, Default, Clone, Deserialize, Serialize)]
pub struct ProgressData<'a> {
    pub source: &'a str,
    pub total: usize,
    pub transferred: usize,
}

/// uninstall node
pub async fn uninstall_node(version: String, current: Option<bool>) -> Result<()> {
    let directory: Option<String> = Config::settings().data().get_directory();
    if let Some(directory) = directory {
        let current = current.unwrap_or(false);
        let directory = PathBuf::from(directory).join(&version);

        let remove_version = async {
            fs::remove_dir_all(&directory).await.context(format!(
                "Failed to remove version directory: {:?}",
                directory
            ))
        };
        let remove_current = async {
            if current {
                let default_path = default_version_path()?;
                fs::remove_dir_all(&default_path).await.context(format!(
                    "Failed to remove the default file: {:?}",
                    default_path
                ))
            } else {
                Ok(())
            }
        };

        let (r_version, r_current) = tokio::join!(remove_version, remove_current);
        r_version?;
        r_current?;
    }

    Ok(())
}

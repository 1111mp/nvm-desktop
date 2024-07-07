use anyhow::Result;
use tokio::fs;

use crate::{
    config::Config,
    utils::{dirs, help},
};

/// Get the currently set node version
pub fn get_current(fetch: Option<bool>) -> Result<Option<String>> {
    let fetch = fetch.unwrap_or(false);
    if !fetch {
        return Ok(Config::node().latest().get_current());
    }

    let current = dirs::default_version_path()
        .and_then(|path| help::read_string(&path))
        .map(Some)
        .unwrap_or_else(|err| {
            log::error!(target: "app", "{err}");
            None
        });

    Config::node().apply();
    Config::node().data().update_current(current.clone())?;

    Ok(current)
}

/// Set the current node version
pub async fn set_current(version: Option<String>) -> Result<()> {
    let version = version.unwrap_or(String::new());
    let default_path = dirs::default_version_path()?;
    // fs::create_dir_all(&default_path).await?;
    fs::write(&default_path, &version).await?;

    // update `current`
    Config::node().apply();
    Config::node().data().update_current(Some(version))?;

    Ok(())
}

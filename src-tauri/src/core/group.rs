use crate::{
    config::{Config, Group}, log_err, utils::{dirs, help}
};
use anyhow::Result;

use super::handle;

/// get project list from `projects.json`
pub async fn group_list(fetch: Option<bool>) -> Result<Option<Vec<Group>>> {
    let fetch = fetch.unwrap_or(false);
    if !fetch {
        return Ok(Config::groups().latest().list.clone());
    }

    let path = dirs::groups_path()?;
    let list = help::async_read_json::<Vec<Group>>(&path).await?;

    // update projects
    Config::groups().draft().update_list(&list)?;
    Config::groups().apply();

    Ok(Some(list))
}

/// update groups & save
pub async fn update_groups(list: Vec<Group>) -> Result<()> {
    Config::groups().draft().update_list(&list)?;
    Config::groups().apply();
    Config::groups().data().save_file()?;

    log_err!(handle::Handle::update_systray_part());

    Ok(())
}

/// update group version
pub async fn update_group_version(name: String, version: String) -> Result<()> {
    Config::groups().draft().update_version(name, version)?;
    Config::groups().apply();
    Config::groups().data().save_file()?;

    Ok(())
}

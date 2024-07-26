use crate::{
    config::{Config, Group},
    utils::{dirs, help},
};
use anyhow::Result;

/// get project list from `projects.json`
pub async fn group_list(fetch: Option<bool>) -> Result<Option<Vec<Group>>> {
    let fetch = fetch.unwrap_or(false);
    if !fetch {
        return Ok(Config::groups().latest().list.clone());
    }

    let path = dirs::groups_path()?;
    let list = help::async_read_json::<Vec<Group>>(&path).await?;

    // update projects
    Config::groups().apply();
    Config::groups().data().update_list(&list)?;

    Ok(Some(list))
}

/// update groups & save
pub async fn update_groups(list: Vec<Group>) -> Result<()> {
    Config::groups().latest().update_groups(list)?;
    Config::groups().apply();
    Ok(())
}

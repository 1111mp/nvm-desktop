use crate::{
    config::{Config, Group, IGroups, SharedDraft},
    logging,
    utils::{dirs, help, logging::Type},
};
use anyhow::Result;

pub async fn fetch_groups() -> Result<SharedDraft<IGroups>> {
    let draft = Config::groups().await;
    let data = draft.data_arc();
    Ok(data)
}

/// get project list from memory
pub async fn group_list() -> Result<Option<Vec<Group>>> {
    Ok(fetch_groups().await?.get_list())
}

/// get project list from `projects.json`
pub async fn group_list_with_sync() -> Result<Option<Vec<Group>>> {
    let path = dirs::groups_path()?;
    let list = help::read_json::<Vec<Group>>(&path).await?;

    Config::groups().await.edit_draft(|d| d.update_list(list));

    Config::groups().await.apply();
    let groups_data = Config::groups().await.data_arc();
    Ok(groups_data.get_list())
}

/// update groups & save
pub async fn update_groups(list: Vec<Group>) -> Result<()> {
    Config::groups().await.edit_draft(|d| d.update_list(list));

    let process_result: std::result::Result<(), anyhow::Error> = {
        super::tray::Tray::global().update_part().await?;
        Ok(())
    };

    if let Err(err) = process_result {
        Config::groups().await.discard();
        return Err(err);
    }

    Config::groups().await.apply();
    let groups_data = Config::groups().await.data_arc();
    logging!(debug, Type::Cmd, "Saving Groups data to file...");
    groups_data.save_file().await?;

    Ok(())
}

/// update group version
pub async fn update_group_version(name: String, version: String) -> Result<()> {
    Config::groups()
        .await
        .edit_draft(|d| d.update_version(&name, &version))?;

    Config::groups().await.apply();
    let groups_data = Config::groups().await.data_arc();
    logging!(debug, Type::Cmd, "Saving Groups data to file...");
    groups_data.save_file().await?;

    Ok(())
}

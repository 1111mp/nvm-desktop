use super::CmdResult;
use crate::{cmd::StringifyErr, config::Group, core::group};

/// get group list
#[tauri::command]
pub async fn group_list(fetch: Option<bool>) -> CmdResult<Vec<Group>> {
    let fetch = fetch.unwrap_or(false);
    if fetch {
        group::group_list_with_sync().await.stringify_err()
    } else {
        group::group_list().await.stringify_err()
    }
}

/// update groups
#[tauri::command]
pub async fn update_groups(list: Vec<Group>) -> CmdResult {
    group::update_groups(list).await.stringify_err()
}

/// update group version
#[tauri::command]
pub async fn update_group_version(name: String, version: String) -> CmdResult {
    group::update_group_version(name, version)
        .await
        .stringify_err()
}

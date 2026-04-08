use crate::{
    cmd::StringifyErr,
    config::{ISettings, SharedDraft},
    core::setting,
};

use super::CmdResult;

/// read settings
#[tauri::command]
pub async fn read_settings() -> CmdResult<SharedDraft<ISettings>> {
    setting::fetch_settings().await.stringify_err()
}

/// update settings
#[tauri::command]
pub async fn update_settings(payload: ISettings) -> CmdResult<()> {
    setting::patch_settings(&payload, true)
        .await
        .stringify_err()
}

use std::path::PathBuf;

use crate::{cmd::StringifyErr, core::configuration};

use super::CmdResult;

/// configuration export
#[tauri::command]
pub async fn configuration_export(
    output_path: PathBuf,
    configuration: configuration::ConfigurationExport,
) -> CmdResult {
    configuration::configuration_export(output_path, configuration)
        .await
        .stringify_err()
}

/// configuration import
#[tauri::command]
pub async fn configuration_import(
    app_handle: tauri::AppHandle,
    sync: bool,
) -> CmdResult<Option<configuration::ConfigurationImport>> {
    configuration::configuration_import(&app_handle, sync)
        .await
        .stringify_err()
}

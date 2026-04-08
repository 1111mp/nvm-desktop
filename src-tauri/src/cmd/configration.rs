use std::path::PathBuf;

use crate::{cmd::StringifyErr, core::configuration};

use super::CmdResult;

/// configration export
#[tauri::command]
pub async fn configration_export(
    output_path: PathBuf,
    configration: configuration::ConfigurationExport,
) -> CmdResult {
    configuration::configuration_export(output_path, configration)
        .await
        .stringify_err()
}

/// configration import
#[tauri::command]
pub async fn configration_import(
    app_handle: tauri::AppHandle,
    sync: bool,
) -> CmdResult<Option<configuration::ConfigurationImport>> {
    configuration::configuration_import(&app_handle, sync)
        .await
        .stringify_err()
}

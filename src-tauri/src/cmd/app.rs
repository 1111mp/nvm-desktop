use super::CmdResult;
use crate::{cmd::StringifyErr, core::app};

/// open project dir with the File Explorer
#[tauri::command]
pub fn open_dir(dir: String) -> CmdResult<()> {
    app::open_dir(dir).stringify_err()
}

#[tauri::command]
pub fn get_system_theme() -> CmdResult<String> {
    app::get_system_theme().stringify_err()
}

/// restart app
#[tauri::command]
pub fn restart(app_handle: tauri::AppHandle) -> CmdResult {
    app::restart(&app_handle).stringify_err()
}

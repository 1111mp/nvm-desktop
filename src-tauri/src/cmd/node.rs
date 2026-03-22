use super::CmdResult;
use crate::{cmd::StringifyErr, config::NVersion, core::node};

/// get current version
#[tauri::command]
pub async fn current(fetch: Option<bool>) -> CmdResult<Option<String>> {
    let fetch = fetch.unwrap_or(false);
    if fetch {
        node::get_current_with_sync().await.stringify_err()
    } else {
        node::get_current().await.stringify_err()
    }
}

/// set current version
#[tauri::command]
pub async fn set_current(version: Option<String>) -> CmdResult<()> {
    node::set_current(version).await.stringify_err()
}

/// fetch node version list
#[tauri::command]
pub async fn version_list(fetch: Option<bool>) -> CmdResult<Option<Vec<NVersion>>> {
    let fetch = fetch.unwrap_or(false);
    if fetch {
        node::get_version_list_with_sync().await.stringify_err()
    } else {
        node::get_version_list().await.stringify_err()
    }
}

/// read node installed version list
#[tauri::command]
pub async fn installed_list(fetch: Option<bool>) -> CmdResult<Option<Vec<String>>> {
    let fetch = fetch.unwrap_or(false);
    if fetch {
        node::fetch_installed_with_sync().await.stringify_err()
    } else {
        node::fetch_installed().await.stringify_err()
    }
}

/// install node
#[tauri::command]
pub async fn install_node(
    window: tauri::Window,
    version: Option<String>,
    arch: Option<String>,
) -> CmdResult<String> {
    node::install_node(window, version, arch)
        .await
        .stringify_err()
}

/// install node
#[tauri::command]
pub async fn install_node_cancel() -> CmdResult {
    node::install_node_cancel().await.stringify_err()
}

/// uninstall node
#[tauri::command]
pub async fn uninstall_node(version: String) -> CmdResult {
    node::uninstall_node(version).await.stringify_err()
}

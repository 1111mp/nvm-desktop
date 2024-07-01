use std::time::Duration;

use crate::{
    config::{Config, ISettings},
    node::*,
    wrap_err,
};

use anyhow::Result;
use get_node::archive::fetch_native;

type CmdResult<T = ()> = Result<T, String>;

/// get current version
#[tauri::command]
pub fn current() -> CmdResult<Option<String>> {
    wrap_err!(get_current())
}

/// fetch node version list
#[tauri::command]
pub async fn version_list(
    fetch: Option<bool>,
    timeout: Option<u64>,
) -> CmdResult<Option<Vec<NVersion>>> {
    wrap_err!(
        read_version_list(&ListParams {
            fetch,
            timeout: timeout.map(Duration::from_millis)
        })
        .await
    )
}

/// read node installed version list
#[tauri::command]
pub async fn installed_list(fetch: Option<bool>) -> CmdResult<Option<Vec<String>>> {
    println!("installed_list");
    wrap_err!(read_installed_list(fetch).await)
}

/// read settings data
#[tauri::command]
pub async fn read_settings() -> CmdResult<ISettings> {
    Ok(Config::settings().data().clone())
}

// /// install node
#[tauri::command]
pub async fn install_node(version: Option<String>) -> CmdResult<()> {
    let version: String = version.unwrap_or("22.3.0".to_string());
    let mirror = { Config::settings().latest().mirror.clone().unwrap() };
    let dest = { Config::settings().latest().directory.clone().unwrap() };

    let on_progress = |source: &str, downloaded: usize, total: usize| {
        println!("Source: {}, Progress: {}/{}", source, downloaded, total);
    };
    wrap_err!(fetch_native(&mirror, &version, &dest, &on_progress).await)
}

#[tauri::command]
pub fn exit_app(app_handle: tauri::AppHandle) {
    app_handle.exit(0);
    std::process::exit(0);
}

use std::{
    sync::{Arc, Mutex},
    time::Duration,
};

use crate::{
    config::{Config, ISettings, NVersion},
    node::{self, ProgressData},
    ret_err, wrap_err,
};

use anyhow::Result;
use get_node::archive::{fetch_native, FetchConfig};
use tauri::Manager;
use tokio::time::Instant;

type CmdResult<T = ()> = Result<T, String>;

/// get current version
#[tauri::command]
pub fn current(fetch: Option<bool>) -> CmdResult<Option<String>> {
    wrap_err!(node::get_current(fetch))
}

/// set current version
#[tauri::command]
pub async fn set_current(version: Option<String>) -> CmdResult<()> {
    wrap_err!(node::set_current(version).await)
}

/// fetch node version list
#[tauri::command]
pub async fn version_list(fetch: Option<bool>) -> CmdResult<Option<Vec<NVersion>>> {
    wrap_err!(node::get_version_list(fetch).await)
}

/// read node installed version list
#[tauri::command]
pub async fn installed_list(fetch: Option<bool>) -> CmdResult<Option<Vec<String>>> {
    wrap_err!(node::get_installed_list(fetch).await)
}

/// read settings
#[tauri::command]
pub async fn read_settings() -> CmdResult<ISettings> {
    Ok(Config::settings().data().clone())
}

/// update settings
#[tauri::command]
pub async fn update_settings(settings: ISettings) -> CmdResult<()> {
    Config::settings().apply();
    wrap_err!({ Config::settings().data().patch_settings(settings) })?;

    Ok(())
}

/// install node
#[tauri::command]
pub async fn install_node(
    window: tauri::Window,
    version: Option<String>,
    arch: Option<String>,
) -> CmdResult<String> {
    if version.is_none() {
        ret_err!("version should not be null");
    }

    let version: String = version.unwrap();
    let settings = Config::settings().latest().clone();
    let mirror = settings.mirror.unwrap();
    let directory = settings.directory.unwrap();

    let last_emit_time = Arc::new(Mutex::new(Instant::now()));

    let config = FetchConfig {
        dest: directory,
        mirror: mirror,
        arch,
        version: version,
        no_proxy: settings.no_proxy,
        proxy: settings.proxy,
        cancel_signal: None,
        timeout: None,
        on_progress: Box::new({
            move |source: &str, transferred: usize, total: usize| {
                let mut last_emit_time = last_emit_time.lock().unwrap();
                let now = Instant::now();
                if now.duration_since(*last_emit_time) >= Duration::from_millis(300) {
                    *last_emit_time = now;
                    println!("Source: {}, Progress: {}/{}", source, transferred, total);
                    // let source: String = source.to_string();
                    let _ = window.emit(
                        "on-node-progress",
                        ProgressData {
                            source,
                            transferred,
                            total,
                        },
                    );
                }
            }
        }),
    };

    wrap_err!(fetch_native(config).await)
}

/// uninstall node
#[tauri::command]
pub async fn uninstall_node(version: Option<String>, current: Option<bool>) -> CmdResult<()> {
    if version.is_none() {
        ret_err!("version should not be null");
    }

    let version = version.unwrap();
    wrap_err!(node::uninstall_node(version, current).await)
}

/// exit app
#[tauri::command]
pub fn exit_app(app_handle: tauri::AppHandle) {
    app_handle.exit(0);
    std::process::exit(0);
}

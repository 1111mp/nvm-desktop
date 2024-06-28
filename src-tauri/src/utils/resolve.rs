use anyhow::Result;
use tauri::{App, AppHandle, Manager};

use crate::{log_err, trace_err, utils::tray};

/// handle something when start app
pub fn resolve_setup(app: &mut App) -> Result<()> {
    #[cfg(target_os = "macos")]
    app.set_activation_policy(tauri::ActivationPolicy::Accessory);

    log_err!(tray::Tray::update_systray(&app.app_handle()));

    create_window(&app.app_handle())?;

    Ok(())
}

/// create main window
pub fn create_window(app_handle: &AppHandle) -> Result<()> {
    if let Some(window) = app_handle.get_webview_window("main") {
        trace_err!(window.unminimize(), "set win unminimize");
        trace_err!(window.show(), "set win visible");
        trace_err!(window.set_focus(), "set win focus");
        return Ok(());
    }

    let builder = tauri::WebviewWindowBuilder::new(
        app_handle,
        "main",
        tauri::WebviewUrl::App("index.html".into()),
    )
    .title("Tauri App")
    .visible(false)
    .fullscreen(false)
    .inner_size(1024.0, 728.0)
    .resizable(false)
    .center();

    #[cfg(target_os = "windows")]
    let window = builder
        .decorations(false)
        .additional_browser_args("--enable-features=msWebView2EnableDraggableRegions --disable-features=OverscrollHistoryNavigation,msExperimentalScrolling")
        .transparent(true)
        .visible(false)
        .build()?;

    if tauri::is_dev() {
        window.open_devtools();
    }

    Ok(())
}

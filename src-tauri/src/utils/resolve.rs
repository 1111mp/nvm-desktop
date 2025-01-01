use anyhow::Result;
use tauri::{App, Manager};
use tauri_plugin_window_state::{StateFlags, WindowExt};

use crate::{
    config::Config,
    core::{handle, tray},
    log_err, trace_err,
    utils::migrate,
};

/// handle something when start app
pub async fn resolve_setup(app: &mut App) {
    #[cfg(target_os = "macos")]
    app.set_activation_policy(tauri::ActivationPolicy::Regular);

    handle::Handle::global().init(app.app_handle());

    log_err!(migrate::init());
    log_err!(tray::Tray::create_systray());

    let silent_start = { Config::settings().data().enable_silent_start };
    if !silent_start.unwrap_or(false) {
        log_err!(create_window());
    }

    log_err!(handle::Handle::update_systray_part());
}

/// create main window
pub fn create_window() -> Result<()> {
    let app_handle = handle::Handle::global().app_handle().unwrap();

    if let Some(window) = handle::Handle::global().get_window() {
        trace_err!(window.show(), "set win visible");
        trace_err!(window.set_focus(), "set win focus");
        return Ok(());
    }

    let builder = tauri::WebviewWindowBuilder::new(
        &app_handle,
        "main",
        tauri::WebviewUrl::App("index.html".into()),
    )
    .title("NVM-Desktop")
    .visible(false)
    .fullscreen(false)
    .inner_size(1024.0, 728.0)
    .min_inner_size(1024.0, 728.0)
    .resizable(false)
    .center();

    #[cfg(target_os = "windows")]
    let window = builder
		.decorations(false)
		.additional_browser_args("--enable-features=msWebView2EnableDraggableRegions --disable-features=OverscrollHistoryNavigation,msExperimentalScrolling")
		.transparent(true)
		.visible(false)
		.build()?;
    #[cfg(target_os = "macos")]
    let window = builder
        .decorations(true)
        .transparent(true)
        .hidden_title(true)
        .shadow(true)
        .title_bar_style(tauri::TitleBarStyle::Overlay)
        .build()?;
    #[cfg(target_os = "linux")]
    let window = builder.decorations(false).transparent(true).build()?;

    #[cfg(debug_assertions)]
    window.open_devtools();

    Ok(())
}

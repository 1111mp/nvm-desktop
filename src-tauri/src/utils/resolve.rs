use crate::{
    config::Config,
    core::{handle, tray},
    log_err, logging, trace_err,
    utils::{logging::Type, migrate, server},
};
use anyhow::Result;
use tauri::AppHandle;

/// handle something when start app
pub async fn resolve_setup_async(app_handle: &AppHandle) {
    logging!(
        info,
        Type::Setup,
        true,
        "Start executing asynchronous setup tasks..."
    );

    #[cfg(target_os = "macos")]
    let _ = app_handle.set_activation_policy(tauri::ActivationPolicy::Regular);

    // Start the embedded server
    server::start_embed_server();

    log_err!(migrate::init());
    log_err!(tray::Tray::create_systray());

    let silent_start = { Config::settings().latest_ref().enable_silent_start };
    if !silent_start.unwrap_or(false) {
        log_err!(create_window());
    }

    log_err!(handle::Handle::update_systray_part());
}

/// create main window
pub fn create_window() -> Result<()> {
    logging!(
        info,
        Type::Window,
        true,
        "Start creating and displaying the main window."
    );

    let app_handle = handle::Handle::global().app_handle().unwrap();

    if let Some(window) = handle::Handle::global().get_window() {
        logging!(
            info,
            Type::Window,
            true,
            "The main window already exists, the existing window will be displayed."
        );

        #[cfg(target_os = "macos")]
        let _ = app_handle.set_dock_visibility(true);

        trace_err!(window.show(), "set win visible");
        trace_err!(window.set_focus(), "set win focus");
        return Ok(());
    }

    let mut builder = tauri::WebviewWindowBuilder::new(
        &app_handle,
        "main",
        tauri::WebviewUrl::App("index.html".into()),
    )
    .title("NVM-Desktop")
    .visible(false)
    .fullscreen(false)
    .inner_size(1024.0, 728.0)
    .min_inner_size(1024.0, 728.0)
    .resizable(true)
    .center();

    #[cfg(target_os = "windows")]
    {
        builder = builder
		.decorations(false)
		.additional_browser_args("--enable-features=msWebView2EnableDraggableRegions --disable-features=OverscrollHistoryNavigation,msExperimentalScrolling")
		.transparent(true);
    }
    #[cfg(target_os = "macos")]
    {
        builder = builder
            .decorations(true)
            .transparent(true)
            .hidden_title(true)
            .shadow(true)
            .title_bar_style(tauri::TitleBarStyle::Overlay);
    }
    #[cfg(target_os = "linux")]
    {
        builder = builder.decorations(false).transparent(true);
    }

    match builder.build() {
        Ok(window) => {
            logging!(
                info,
                Type::Window,
                true,
                "The main window instance was created successfully."
            );

            #[cfg(debug_assertions)]
            window.open_devtools();
        }
        Err(err) => {
            logging!(
                error,
                Type::Window,
                true,
                "Main window build failed: {}",
                err
            );
        }
    }

    Ok(())
}

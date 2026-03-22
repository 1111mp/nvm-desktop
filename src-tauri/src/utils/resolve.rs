use crate::{
    config::{Config, ISettingsResponse},
    core::{handle, tray},
    log_err, logging, logging_error,
    process::AsyncHandler,
    trace_err,
    utils::{logging::Type, migrate, server},
};
use anyhow::Result;
use dark_light::{detect as detect_system_theme, Mode as SystemTheme};
use tauri::{utils::config::Color, Theme};

const DARK_BACKGROUND_COLOR: Color = Color(0, 0, 0, 255); // #000000
const LIGHT_BACKGROUND_COLOR: Color = Color(255, 255, 255, 255); // #ffffff

#[cfg(any(target_os = "windows", target_os = "linux"))]
const DEFAULT_DECORATIONS: bool = false;
#[cfg(target_os = "macos")]
const DEFAULT_DECORATIONS: bool = true;

/// handle something when start app
pub fn resolve_setup_async() {
    AsyncHandler::spawn(|| async {
        logging!(
            info,
            Type::Setup,
            "Start executing asynchronous setup tasks..."
        );

        init_window().await;

        // Start the embedded server
        server::start_embed_server();
        // migrate
        migrate::init();
        // tary
        tray::Tray::init_systray();
        logging_error!(Type::Setup, handle::Handle::update_systray_part().await);
    });
}

pub async fn init_window() {
    let app_handle = handle::Handle::app_handle();

    #[cfg(target_os = "macos")]
    let _ = app_handle.set_activation_policy(tauri::ActivationPolicy::Regular);

    let silent_start = Config::settings()
        .await
        .data_arc()
        .enable_silent_start
        .unwrap_or(false);
    if !silent_start {
        log_err!(create_window().await);
    }
}

/// create main window
pub async fn create_window() -> Result<()> {
    logging!(
        info,
        Type::Window,
        true,
        "Start creating and displaying the main window."
    );

    let app_handle = handle::Handle::app_handle();

    if let Some(window) = handle::Handle::global().get_main_window() {
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

    let settings = Config::settings().await.data_arc().into_response();
    let initial_theme_mode = match settings.theme.as_deref() {
        Some("dark") => "dark",
        Some("light") => "light",
        _ => "system",
    };

    let system_theme = detect_system_theme().ok();
    let resolved_theme = match initial_theme_mode {
        "dark" => Some(Theme::Dark),
        "light" => Some(Theme::Light),
        _ => match system_theme {
            Some(SystemTheme::Dark) => Some(Theme::Dark),
            Some(SystemTheme::Light) | Some(SystemTheme::Unspecified) | None => Some(Theme::Light),
        },
    };

    let prefers_dark_background = matches!(resolved_theme, Some(Theme::Dark));
    let background_color = if prefers_dark_background {
        DARK_BACKGROUND_COLOR
    } else {
        LIGHT_BACKGROUND_COLOR
    };

    let initial_theme_str = match resolved_theme {
        Some(Theme::Dark) => "dark",
        Some(Theme::Light) => "light",
        _ => "light",
    };

    let initial_script = build_window_initial_script(settings, initial_theme_str);

    let mut builder = tauri::WebviewWindowBuilder::new(
        app_handle,
        "main",
        tauri::WebviewUrl::App("index.html".into()),
    )
    .title("NVM-Desktop")
    .visible(true)
    .fullscreen(false)
    .inner_size(1024.0, 728.0)
    .min_inner_size(1024.0, 728.0)
    .resizable(true)
    .center()
    .decorations(DEFAULT_DECORATIONS)
    .initialization_script(&initial_script);

    #[cfg(target_os = "macos")]
    {
        builder = builder
            .hidden_title(true)
            .title_bar_style(tauri::TitleBarStyle::Overlay);
    }

    if let Some(theme) = resolved_theme {
        builder = builder.theme(Some(theme));
    }

    builder = builder.background_color(background_color);

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

fn build_window_initial_script(settings: ISettingsResponse, resolved_theme: &str) -> String {
    let settings_json = serde_json::to_string(&settings).unwrap_or_default();
    let script = r##"
        if (sessionStorage.getItem('__NVMD_INITIAL__') === null) {
            sessionStorage.setItem('__NVMD_INITIAL__', 'no');
        }
    "##;
    format!(
        r##"
		window.__NVMD_INITIAL_SETTINGS__ = {settings_json};
        window.__NVMD_INITIAL_THEME__ = "{resolved_theme}";

        {script}
        "##,
        settings_json = settings_json,
        resolved_theme = resolved_theme,
        script = script,
    )
}

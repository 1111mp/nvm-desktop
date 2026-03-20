use crate::{
    config::{Config, ISettingsResponse},
    core::{handle, tray},
    log_err, logging, trace_err,
    utils::{logging::Type, migrate, server},
};
use anyhow::Result;
use dark_light::{detect as detect_system_theme, Mode as SystemTheme};
use tauri::AppHandle;
use tauri::{utils::config::Color, Theme};

const DARK_BACKGROUND_COLOR: Color = Color(0, 0, 0, 255); // #000000
const LIGHT_BACKGROUND_COLOR: Color = Color(255, 255, 255, 255); // #ffffff

#[cfg(any(target_os = "windows", target_os = "linux"))]
const DEFAULT_DECORATIONS: bool = false;
#[cfg(target_os = "macos")]
const DEFAULT_DECORATIONS: bool = true;

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

    let settings = Config::settings().latest_ref().data();
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
        &app_handle,
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

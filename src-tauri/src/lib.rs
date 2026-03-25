mod cmd;
mod config;
mod core;
mod process;
mod utils;

use crate::{
    config::Config,
    core::app,
    process::AsyncHandler,
    utils::{logging::Type, resolve},
};
use once_cell::sync::OnceCell;
use tauri::{AppHandle, Manager};

pub static APP_HANDLE: OnceCell<AppHandle> = OnceCell::new();

pub fn run() {
    #[cfg(target_os = "linux")]
    utils::linux::workarounds::apply_nvidia_dmabuf_renderer_workaround();

    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        // Ensure single instance operation
        .plugin(
            tauri_plugin_single_instance::Builder::new()
                // Set a custom D-Bus ID, used on Linux
                // Defaults to the app's bundle identifier set in tauri.conf.json.
                .dbus_id("io.github.mp1111.nvm_desktop")
                .callback(|app_handle, _argc, _cwd| {
                    if let Some(window) = app_handle.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.unminimize();
                        let _ = window.set_focus();
                    }
                })
                .build(),
        )
        .setup(|app| {
            APP_HANDLE
                .set(app.app_handle().clone())
                .expect("failed to set global app handle");

            logging!(info, Type::Setup, "Starting application initialization...");

            if let Err(e) = setup_window_state(app) {
                logging!(error, Type::Setup, "Failed to setup window state: {}", e);
            }

            resolve::resolve_setup_async();

            logging!(info, Type::Setup, "Initialization has started");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // setting
            cmd::setting::read_settings,
            cmd::setting::update_settings,
            // node
            cmd::node::current,
            cmd::node::set_current,
            cmd::node::version_list,
            cmd::node::installed_list,
            cmd::node::install_node,
            cmd::node::uninstall_node,
            cmd::node::install_node_cancel,
            // project
            cmd::project::project_list,
            cmd::project::add_projects,
            cmd::project::update_projects,
            cmd::project::update_projects_without_tray,
            cmd::project::sync_project_version,
            cmd::project::batch_update_project_version,
            cmd::project::open_with_vscode,
            // group
            cmd::group::group_list,
            cmd::group::update_groups,
            cmd::group::update_group_version,
            // configuration
            cmd::configration::configration_export,
            cmd::configration::configration_import,
            // app
            cmd::app::open_dir,
            cmd::app::restart,
            cmd::app::get_system_theme,
        ]);

    #[cfg(debug_assertions)]
    {
        let devtools = tauri_plugin_devtools::init();
        builder = builder.plugin(devtools);
    }

    #[cfg(not(debug_assertions))]
    {
        use tauri_plugin_log::{Builder, Target, TargetKind, TimezoneStrategy};

        let log_plugin = Builder::default()
            .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepAll)
            .targets([
                Target::new(TargetKind::Stdout),
                Target::new(TargetKind::LogDir { file_name: None }),
                // Target::new(TargetKind::Webview),
            ])
            .timezone_strategy(TimezoneStrategy::UseLocal)
            .level(log::LevelFilter::Info)
            .filter(|metadata| {
                let target = metadata.target();
                target == "app"
            })
            .build();

        builder = builder.plugin(log_plugin);
    }

    let app = builder
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    app.run(|_, evt| match evt {
        tauri::RunEvent::WindowEvent { label, event, .. } if label == "main" => match event {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                api.prevent_close();

                AsyncHandler::spawn(move || async move {
                    let closer = Config::settings()
                        .await
                        .data_arc()
                        .get_closer()
                        .unwrap_or("minimize".to_string());
                    if closer == "close" {
                        app::exit_app();
                    } else {
                        app::hide();
                    }
                });
            }
            _ => {}
        },
        _ => {}
    });
}

/// Setup window state management
fn setup_window_state(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    logging!(info, Type::Setup, "Initialize window state management...");
    let window_state_plugin = tauri_plugin_window_state::Builder::new()
        .with_state_flags(tauri_plugin_window_state::StateFlags::default())
        .build();
    app.handle().plugin(window_state_plugin)?;
    Ok(())
}

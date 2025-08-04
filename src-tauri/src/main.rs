// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod cmds;
mod config;
mod core;
mod utils;

use config::Config;
use tauri::Manager;
use utils::resolve;

fn main() -> tauri::Result<()> {
    #[cfg(target_os = "linux")]
    std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");

    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        // Ensure single instance operation
        .plugin(tauri_plugin_single_instance::init(
            |app_handle, _argc, _cwd| {
                if let Some(window) = app_handle.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.unminimize();
                    let _ = window.set_focus();
                }
            },
        ))
        .setup(|app| {
            tauri::async_runtime::block_on(async move {
                resolve::resolve_setup(app).await;
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // settings
            cmds::read_settings,
            cmds::update_settings,
            // node
            cmds::current,
            cmds::set_current,
            cmds::version_list,
            cmds::installed_list,
            cmds::install_node,
            cmds::uninstall_node,
            cmds::install_node_cancel,
            // projects
            cmds::project_list,
            cmds::select_projects,
            cmds::update_projects,
            cmds::sync_project_version,
            cmds::batch_update_project_version,
            cmds::open_dir,
            cmds::open_with_vscode,
            // groups
            cmds::group_list,
            cmds::update_groups,
            cmds::update_group_version,
            // configuration
            cmds::configration_export,
            cmds::configration_import,
            // app
            cmds::restart,
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
                target == "app" || target == "migrate"
            })
            .build();

        builder = builder.plugin(log_plugin);
    }

    let app = builder.build(tauri::generate_context!())?;

    app.run(|app_handle, err| match err {
        tauri::RunEvent::WindowEvent { label, event, .. } => {
            if label == "main" {
                match event {
                    tauri::WindowEvent::CloseRequested { api, .. } => {
                        let closer = Config::settings()
                            .latest_ref()
                            .get_closer()
                            .unwrap_or("minimize".to_string());
                        if closer == "close" {
                            return;
                        }

                        #[cfg(target_os = "macos")]
                        let _ = app_handle.set_dock_visibility(false);

                        // CloseRequested Event
                        api.prevent_close();
                        if let Some(window) = core::handle::Handle::global().get_window() {
                            log_err!(window.hide());
                        }
                    }
                    _ => {}
                }
            }
        }
        _ => {}
    });

    Ok(())
}

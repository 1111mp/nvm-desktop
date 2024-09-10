// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod cmds;
mod config;
mod core;
mod utils;

use config::Config;
use tauri::Manager;
use tauri_plugin_log::{Target, TargetKind};
use utils::resolve;

fn main() -> tauri::Result<()> {
    #[cfg(target_os = "linux")]
    std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");

    let builder = tauri::Builder::default()
        .setup(|app| {
            resolve::resolve_setup(app)?;
            Ok(())
        })
        .plugin(tauri_plugin_updater::Builder::default().build())
        .plugin(
            tauri_plugin_log::Builder::default()
                .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepAll)
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir { file_name: None }),
                    // Target::new(TargetKind::Webview),
                ])
                .build(),
        )
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        // Ensure single instance operation
        .plugin(tauri_plugin_single_instance::init(
            |app_handle, _argc, _cwd| {
                let windows = app_handle.webview_windows();
                if let Some(windows) = windows.values().next() {
                    let _ = windows.set_focus();
                }
            },
        ))
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
            // groups
            cmds::group_list,
            cmds::update_groups,
            cmds::update_group_version,
            // configration
            cmds::configration_export,
            cmds::configration_import,
            // app
            cmds::restart,
        ]);

    let app = builder.build(tauri::generate_context!())?;

    app.run(|app_handle, err| match err {
        tauri::RunEvent::ExitRequested { api, .. } => {
            let closer = Config::settings()
                .data()
                .get_closer()
                .unwrap_or("minimize".to_string());

            if closer == "minimize" {
                api.prevent_exit();
            }
        }
        tauri::RunEvent::WindowEvent { label, event, .. } => {
            if label == "main" {
                match event {
                    tauri::WindowEvent::Destroyed => {
                        // Destroyed Event
                    }
                    tauri::WindowEvent::CloseRequested { api, .. } => {
                        // CloseRequested Event
                    }
                    _ => {}
                }
            }
        }
        _ => {}
    });

    Ok(())
}

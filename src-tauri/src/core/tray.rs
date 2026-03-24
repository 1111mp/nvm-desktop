use super::handle;
use crate::config::Config;
use crate::config::{Group, Project};
use crate::core::{app, node, project};
use crate::process::AsyncHandler;
use crate::utils::logging::Type;
use crate::utils::resolve;
use crate::{logging, logging_error};
use anyhow::Result;
use tauri::menu::{AboutMetadataBuilder, CheckMenuItem, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::tray::{MouseButton, TrayIcon, TrayIconEvent};
use tauri::{
    image::Image,
    menu::{IsMenuItem, MenuEvent, PredefinedMenuItem, Submenu, SubmenuBuilder},
    AppHandle, Manager, Wry,
};

#[derive(Default)]
pub struct Tray {}

impl Tray {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn global() -> &'static Tray {
        static TRAY: std::sync::OnceLock<Tray> = std::sync::OnceLock::new();
        TRAY.get_or_init(|| Self::new())
    }

    pub async fn init(&self) -> Result<()> {
        if handle::Handle::global().is_exiting() {
            logging!(
                debug,
                Type::Setup,
                "The application is exiting, skipping tray initialization."
            );
            return Ok(());
        }

        let app_handle = handle::Handle::app_handle();
        match self.create_tray_from_handle(app_handle).await {
            Ok(_) => {
                logging!(info, Type::Tray, "Tray initialized successfully");
            }
            Err(e) => {
                // Don't return error, let application continue running without tray
                logging!(
                    warn,
                    Type::Tray,
                    "Failed to initialize tray: {e}. Continuing without tray",
                );
            }
        }
        Ok(())
    }

    async fn create_tray_from_handle(&self, app_handle: &AppHandle) -> Result<()> {
        if handle::Handle::global().is_exiting() {
            logging!(
                debug,
                Type::Setup,
                "Application is exiting, skipping tray create"
            );
            return Ok(());
        }

        logging!(info, Type::Tray, "System tray creating...");

        #[cfg(target_os = "linux")]
        let icon_bytes = include_bytes!("../../icons/icon.ico").to_vec();
        #[cfg(target_os = "windows")]
        let icon_bytes = include_bytes!("../../icons/icon.png").to_vec();
        #[cfg(target_os = "macos")]
        let icon_bytes = include_bytes!("../../icons/icon-template.png").to_vec();

        let icon = tauri::image::Image::from_bytes(&icon_bytes)?;

        let mut builder = TrayIconBuilder::with_id("main")
            .icon(icon)
            .icon_as_template(false);

        #[cfg(target_os = "macos")]
        {
            builder = builder.icon_as_template(true);
        }

        let tray = builder.build(app_handle)?;
        tray.on_tray_icon_event(on_tray_icon_event);
        tray.on_menu_event(on_menu_event);

        Ok(())
    }

    pub async fn update_part(&self) -> Result<()> {
        if handle::Handle::global().is_exiting() {
            logging!(
                debug,
                Type::Tray,
                "Application is exiting, skipping partial tray update"
            );
            return Ok(());
        }

        self.update_menu().await?;

        Ok(())
    }

    pub async fn update_menu(&self) -> Result<()> {
        if handle::Handle::global().is_exiting() {
            logging!(
                debug,
                Type::Tray,
                "Application is exiting, skipping tray menu update"
            );
            return Ok(());
        }

        let app_handle = handle::Handle::app_handle();
        self.update_menu_internal(app_handle).await
    }

    async fn update_menu_internal(&self, app_handle: &AppHandle) -> Result<()> {
        let Some(tray) = app_handle.tray_by_id("main") else {
            logging!(
                warn,
                Type::Tray,
                "Failed to update tray menu: tray not found"
            );
            return Ok(());
        };

        let settings = Config::settings().await.latest_arc();
        let zh = settings.locale.as_deref() == Some("zh-CN");

        let node = Config::node().await.latest_arc();
        let current = { node.current.as_deref() }.unwrap_or_default();
        let installed_versions = node.installed.as_deref().unwrap_or_default();

        let projects = Config::projects().await.latest_arc();
        let projects_list = projects.list.as_deref().unwrap_or_default();

        let groups = Config::groups().await.latest_arc();
        let groups_list = groups.list.as_deref().unwrap_or_default();

        logging_error!(
            Type::Tray,
            tray.set_menu(Some(
                create_tray_menu(
                    app_handle,
                    zh,
                    current,
                    installed_versions,
                    projects_list,
                    groups_list
                )
                .await?
            ))
        );

        logging!(debug, Type::Tray, "Tray menu updated successfully");
        Ok(())
    }
}

fn build_check_menu_items(
    app_handle: &AppHandle,
    name: &str,
    current: &str,
    versions: &[String],
) -> Result<Vec<CheckMenuItem<Wry>>> {
    versions
        .iter()
        .map(|version| {
            CheckMenuItem::with_id(
                app_handle,
                format!("{}_version_{}", name, version),
                format!("v{}", version),
                true,
                current == version,
                None::<&str>,
            )
            .map_err(|e| e.into())
        })
        .collect()
}

async fn create_tray_menu(
    app_handle: &AppHandle,
    zh: bool,
    current: &str,
    installed_versions: &[String],
    projects: &[Project],
    groups: &[Group],
) -> Result<tauri::menu::Menu<Wry>> {
    macro_rules! t {
        ($en: expr, $zh: expr) => {
            if zh {
                $zh
            } else {
                $en
            }
        };
    }

    let app_info = app_handle.package_info();

    let open_window =
        &MenuItem::with_id(app_handle, "open_window", "NVM-Desktop", true, None::<&str>)?;

    let installed_versions_items =
        build_check_menu_items(app_handle, "global", current, installed_versions)?;

    let installed_versions_items_ref: Vec<&dyn IsMenuItem<Wry>> = installed_versions_items
        .iter()
        .map(|item| item as &dyn IsMenuItem<Wry>)
        .collect();

    let global = &Submenu::with_id_and_items(
        app_handle,
        "global",
        "Global (default)",
        true,
        &installed_versions_items_ref,
    )?;

    let projects_menu = projects
        .iter()
        .map(|project| {
            let version = project.version.as_deref().unwrap_or_default();

            let versions_menu =
                build_check_menu_items(app_handle, &project.name, version, installed_versions)?;
            let groups_menu = groups
                .iter()
                .map(|group| {
                    CheckMenuItem::with_id(
                        app_handle,
                        format!("{}_group_{}", &project.name, &group.name),
                        &group.name,
                        true,
                        version == &group.name,
                        None::<&str>,
                    )
                    .map_err(|e| e.into())
                })
                .collect::<Result<Vec<CheckMenuItem<Wry>>>>()?;

            let versions_menu_ref: Vec<&dyn IsMenuItem<Wry>> = versions_menu
                .iter()
                .map(|item| item as &dyn IsMenuItem<Wry>)
                .collect();
            let groups_menu_ref: Vec<&dyn IsMenuItem<Wry>> = groups_menu
                .iter()
                .map(|item| item as &dyn IsMenuItem<Wry>)
                .collect();

            Ok(
                SubmenuBuilder::with_id(app_handle, &project.name, &project.name)
                    .items(&versions_menu_ref)
                    .separator()
                    .items(&groups_menu_ref)
                    .build()?,
            )
        })
        .collect::<Result<Vec<Submenu<Wry>>>>()?;

    let projects_menu_ref: Vec<&dyn IsMenuItem<Wry>> = projects_menu
        .iter()
        .map(|item| item as &dyn IsMenuItem<Wry>)
        .collect();

    // open config dir
    let open_config_dir = &MenuItem::with_id(
        app_handle,
        "open_config_dir",
        t!("Config Dir", "配置目录"),
        true,
        None::<&str>,
    )?;
    // open data dir
    let open_data_dir = &MenuItem::with_id(
        app_handle,
        "open_data_dir",
        t!("Data Dir", "数据目录"),
        true,
        None::<&str>,
    )?;
    // open logs dir
    let open_logs_dir = &MenuItem::with_id(
        app_handle,
        "open_logs_dir",
        t!("Logs Dir", "日志目录"),
        true,
        None::<&str>,
    )?;

    let open_dir = &Submenu::with_id_and_items(
        app_handle,
        "open_dir",
        t!("Open Dir", "打开目录"),
        true,
        &[open_config_dir, open_data_dir, open_logs_dir],
    )?;

    let devtools = &MenuItem::with_id(
        app_handle,
        "open_dev_tools",
        t!("Open Dev Tools", "开发者工具"),
        true,
        None::<&str>,
    )?;

    let icon_path = app_handle.path().resource_dir()?.join("icons/icon.png");
    let about = &PredefinedMenuItem::about(
        app_handle,
        Some(t!("About NVM-Desktop", "关于 NVM-Desktop")),
        Some(
            AboutMetadataBuilder::new()
                .version(Some(app_info.version.to_string()))
                .name(Some(&app_info.name))
                .license(Some("MIT"))
                .icon(Some(Image::from_path(icon_path)?))
                .build(),
        ),
    )?;

    let quit = &MenuItem::with_id(
        app_handle,
        "quit",
        t!("Quit NVM-Desktop", "退出 NVM-Desktop"),
        true,
        Some("CmdOrCtrl+Q"),
    )?;

    let separator = &PredefinedMenuItem::separator(app_handle)?;

    let mut menu_items: Vec<&dyn IsMenuItem<Wry>> = vec![open_window, separator, global];

    menu_items.extend_from_slice(&projects_menu_ref);

    menu_items.extend_from_slice(&[separator, open_dir, devtools, about, quit]);

    let menu = tauri::menu::MenuBuilder::with_id(app_handle, "tary_menu")
        .items(&menu_items)
        .build()?;
    Ok(menu)
}

fn on_tray_icon_event(_tray_icon: &TrayIcon, event: TrayIconEvent) {
    #[cfg(not(target_os = "macos"))]
    if let TrayIconEvent::Click {
        button: MouseButton::Left,
        ..
    } = event
    {
        AsyncHandler::spawn(|| async {
            let _ = resolve::create_window().await;
        });
    }
}

fn on_menu_event(_: &AppHandle, event: MenuEvent) {
    if event.id.as_ref().is_empty() {
        return;
    }

    AsyncHandler::spawn(|| async move {
        match event.id().as_ref() {
            "open_window" => {
                let _ = resolve::create_window().await;
            }
            "quit" => super::app::exit_app(),
            "open_config_dir" => crate::log_err!(app::open_config_dir()),
            "open_data_dir" => crate::log_err!(app::open_data_dir()),
            "open_logs_dir" => crate::log_err!(app::open_logs_dir()),
            "open_dev_tools" => {
                super::app::open_devtools();
            }
            id if id.contains("_version_") => {
                let Some((name, version)) = id.split_once("_version_") else {
                    return;
                };
                if name == "global" {
                    logging_error!(
                        Type::Tray,
                        node::update_current_from_menu(Some(version.to_owned())).await
                    );
                } else {
                    logging_error!(
                        Type::Tray,
                        project::change_with_version(name, version).await
                    );
                }
            }
            id if id.contains("_group_") => {
                let Some((name, group_name)) = id.split_once("_group_") else {
                    return;
                };

                logging_error!(
                    Type::Tray,
                    project::change_with_group(&name, &group_name).await
                );
            }
            _ => {
                logging!(
                    debug,
                    Type::Tray,
                    "Unhandled tray menu event: {:?}",
                    event.id
                );
            }
        }
    });
}

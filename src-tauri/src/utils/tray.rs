use super::resolve;
use crate::config::Project;
use crate::core::project;
use crate::{cmds, config::Config, log_err};
use anyhow::{bail, Ok, Result};
use serde::{Deserialize, Serialize};
use tauri::menu::AboutMetadataBuilder;
use tauri::{
    async_runtime::spawn,
    image::Image,
    menu::{
        CheckMenuItem, CheckMenuItemBuilder, IsMenuItem, Menu, MenuBuilder, MenuEvent,
        MenuItemBuilder, PredefinedMenuItem, Submenu, SubmenuBuilder,
    },
    tray::TrayIconBuilder,
    AppHandle, Emitter, Manager, Wry,
};

pub struct Tray {}

impl Tray {
    pub fn tray_menu(app_handle: &AppHandle) -> Result<Menu<Wry>> {
        let zh = { Config::settings().latest().locale == Some("zh-CN".into()) };
        // projects (keep max length 5)
        let mut projects = { Config::projects().latest().get_list() }.unwrap_or(vec![]);
        projects.truncate(5);
        // groups
        let groups = Config::groups();
        let groups = groups.latest();
        let default_groups = vec![];
        let groups = groups.list.as_ref().unwrap_or(&default_groups);
        // installed versions
        let node = Config::node();
        let node = node.latest();
        let default_installed = vec![];
        let installed = node.installed.as_ref().unwrap_or(&default_installed);

        macro_rules! t {
            ($en: expr, $zh: expr) => {
                if zh {
                    $zh
                } else {
                    $en
                }
            };
        }

        let sub_items = projects
            .iter()
            .map(|project| {
                let project_version = project.version.as_deref().unwrap_or("");
                let version_items = installed
                    .iter()
                    .map(|version| {
                        Ok(CheckMenuItemBuilder::with_id(
                            format!("{}_version_{}", &project.name, version),
                            format!("v{}", version),
                        )
                        .checked(project_version == version)
                        .build(app_handle)?)
                    })
                    .collect::<Result<Vec<_>>>()?;
                let group_items = groups
                    .iter()
                    .map(|group| {
                        Ok(CheckMenuItemBuilder::new(&group.name)
                            .id(format!("{}_group_{}", &project.name, &group.name))
                            .checked(project_version == &group.name)
                            .build(app_handle)?)
                    })
                    .collect::<Result<Vec<_>>>()?;
                let version_items_refs: Vec<&dyn IsMenuItem<Wry>> = version_items
                    .iter()
                    .map(|item| item as &dyn IsMenuItem<Wry>)
                    .collect();
                let group_items_refs: Vec<&dyn IsMenuItem<Wry>> = group_items
                    .iter()
                    .map(|item| item as &dyn IsMenuItem<Wry>)
                    .collect();

                Ok(
                    SubmenuBuilder::with_id(app_handle, &project.name, &project.name)
                        .items(&version_items_refs)
                        .separator()
                        .items(&group_items_refs)
                        .build()?,
                )
            })
            .collect::<Result<Vec<Submenu<Wry>>>>()?;
        let sub_items_refs: Vec<&dyn IsMenuItem<Wry>> = sub_items
            .iter()
            .map(|item| item as &dyn IsMenuItem<Wry>)
            .collect();

        Ok(MenuBuilder::with_id(app_handle, "tray_menu")
            .item(
                &MenuItemBuilder::with_id("open_window", t!("NVM-Desktop", "NVM-Desktop"))
                    .build(app_handle)?,
            )
            .separator()
            .items(&sub_items_refs)
            .separator()
            .items(&[
                &PredefinedMenuItem::about(
                    app_handle,
                    Some(t!("About NVM-Desktop", "关于 NVM-Desktop")),
                    Some(
                        AboutMetadataBuilder::new()
                            .icon(Some(Image::from_path("icons/icon.png")?))
                            .build(),
                    ),
                )?,
                &MenuItemBuilder::with_id("quit", t!("Quit NVM-Desktop", "退出 NVM-Desktop"))
                    .accelerator("CmdOrCtrl+Q")
                    .build(app_handle)?,
            ])
            .build()?)
    }

    pub fn update_systray(app_handle: &AppHandle) -> Result<()> {
        let builder = TrayIconBuilder::with_id("main")
            .tooltip("NVM-Desktop")
            .menu(&Tray::tray_menu(app_handle)?)
            .on_menu_event(Tray::on_menu_event)
            .on_tray_icon_event(|tray, event| {
                #[cfg(not(target_os = "macos"))]
                if let TrayIconEvent::Click {
                    button: MouseButton::Left,
                    ..
                } = event
                {
                    let _ = resolve::create_window(&tray.app_handle());
                }
            });

        #[cfg(not(target_os = "macos"))]
        builder
            .icon(Image::from_path("icons/icon.png")?)
            .build(app_handle)?;
        #[cfg(target_os = "macos")]
        builder
            .icon(Image::from_path("icons/icon-template.png")?)
            .icon_as_template(true)
            .build(app_handle)?;

        Ok(())
    }

    pub fn update_part(app_handle: &AppHandle, version: String) -> Result<()> {
        let tray = app_handle.tray_by_id("main");
        if tray.is_none() {
            bail!("The system tray menu has not been initialized");
        }
        let tray = tray.unwrap();
        tray.set_menu(Some(Tray::tray_menu(app_handle)?))?;

        if let Some(window) = app_handle.get_webview_window("main") {
            window.emit("call-projects-update", version)?;
        }

        Ok(())
    }

    pub fn on_menu_event(app_handle: &AppHandle, event: MenuEvent) {
        match event.id().as_ref() {
            "open_window" => {
                let _ = resolve::create_window(app_handle);
            }
            "quit" => cmds::exit_app(app_handle.clone()),
            id if id.contains("_version_") => {
                let info = id.split("_version_").collect::<Vec<_>>();
                if info.len() == 2 {
                    let name = info[0].to_string();
                    let version = info[1].to_string();

                    spawn(async move {
                        log_err!(project::change_with_version(name, version).await);
                    });
                }
            }
            id if id.contains("_group_") => {
                let info = id.split("_group_").collect::<Vec<_>>();
                if info.len() == 2 {
                    let name = info[0].to_string();
                    let group_name = info[1].to_string();
                    spawn(async move {
                        log_err!(project::change_with_group(name, group_name).await);
                    });
                }
            }
            _ => {}
        }
    }
}

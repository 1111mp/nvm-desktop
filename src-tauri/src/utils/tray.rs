use anyhow::{Ok, Result};
use tauri::{
    image::Image,
    menu::{
        CheckMenuItem, CheckMenuItemBuilder, IsMenuItem, Menu, MenuBuilder, MenuEvent, MenuItem,
        MenuItemBuilder, Submenu, SubmenuBuilder,
    },
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
    AppHandle, Wry,
};

use crate::{cmds, config::Config};

use super::resolve;

pub struct Tray {}

fn test(app_handle: &AppHandle) -> Result<CheckMenuItem<Wry>> {
    let item = CheckMenuItemBuilder::new("text")
        .checked(false)
        .build(app_handle)?;

    Ok(item)
}

impl Tray {
    pub fn tray_menu(app_handle: &AppHandle) -> Result<Menu<Wry>> {
        let zh = { Config::settings().latest().locale == Some("zh-CN".into()) };
        let mut projects = { Config::projects().latest().get_list() }.unwrap_or(vec![]);
        projects.truncate(5);
        let groups = { Config::groups().latest().get_list() }.unwrap_or(vec![]);
        let installed = { Config::node().latest().get_installed() }.unwrap_or(vec![]);
        let version: String = app_handle.package_info().version.to_string();

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
                        Ok(CheckMenuItemBuilder::new(format!("v{}", version))
                            .id(format!("{}_{}", &project.name, &version))
                            .checked(project_version == version)
                            .build(app_handle)?)
                    })
                    .collect::<Result<Vec<_>>>()?;
                let group_items = groups
                    .iter()
                    .map(|group| {
                        Ok(CheckMenuItemBuilder::new(&group.name)
                            .id(format!("{}_{}", &project.name, &group.name))
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

                Ok(SubmenuBuilder::new(app_handle, &project.name)
                    .items(&version_items_refs)
                    .separator()
                    .items(&group_items_refs)
                    .build()?)
            })
            .collect::<Result<Vec<Submenu<Wry>>>>()?;
        let sub_items_refs: Vec<&dyn IsMenuItem<Wry>> = sub_items
            .iter()
            .map(|item| item as &dyn IsMenuItem<Wry>)
            .collect();

        Ok(MenuBuilder::new(app_handle)
            .item(
                &MenuItemBuilder::with_id("open_window", t!("NVM-Desktop", "NVM-Desktop"))
                    .build(app_handle)?,
            )
            .separator()
            .items(&sub_items_refs)
            .separator()
            .items(&[
                &MenuItem::new(
                    app_handle,
                    format!("Version {version}"),
                    false,
                    None::<&str>,
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

    pub fn update_part() -> Result<()> {
        Ok(())
    }

    pub fn on_menu_event(app_handle: &AppHandle, event: MenuEvent) {
        match event.id().as_ref() {
            "open_window" => {
                let _ = resolve::create_window(app_handle);
            }
            "quit" => cmds::exit_app(app_handle.clone()),
            id => {
                println!("id: {}", id);
            }
        }
    }
}

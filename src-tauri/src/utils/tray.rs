use anyhow::Result;
use tauri::{
    image::Image,
    menu::{CheckMenuItem, Menu, MenuBuilder, MenuEvent, MenuItem, MenuItemBuilder},
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
    AppHandle, Wry,
};

use crate::{cmds, config::Config};

use super::resolve;

pub struct Tray {}

impl Tray {
    pub fn tray_menu(app_handle: &AppHandle) -> Result<Menu<Wry>> {
        let zh = { Config::settings().latest().locale == Some("zh-CN".into()) };
        let version = app_handle.package_info().version.to_string();

        macro_rules! t {
            ($en: expr, $zh: expr) => {
                if zh {
                    $zh
                } else {
                    $en
                }
            };
        }

        Ok(MenuBuilder::new(app_handle)
            .item(
                &MenuItemBuilder::with_id("open_window", t!("NVM-Desktop", "NVM-Desktop"))
                    .build(app_handle)?,
            )
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

    pub fn on_menu_event(app_handle: &AppHandle, event: MenuEvent) {
        match event.id().as_ref() {
            "open_window" => {
                let _ = resolve::create_window(app_handle);
            }
            "quit" => cmds::exit_app(app_handle.clone()),
            _ => {}
        }
    }
}

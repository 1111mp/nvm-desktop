use super::tray::Tray;
use crate::{logging, utils::logging::Type, APP_HANDLE};
use anyhow::Result;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{AppHandle, Manager, WebviewWindow};

#[derive(Debug)]
pub struct Handle {
    is_exiting: AtomicBool,
}

impl Default for Handle {
    fn default() -> Self {
        Self {
            is_exiting: AtomicBool::new(false),
        }
    }
}

impl Handle {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn global() -> &'static Handle {
        static HANDLE: std::sync::OnceLock<Handle> = std::sync::OnceLock::new();
        HANDLE.get_or_init(|| Self::new())
    }

    pub fn app_handle() -> &'static AppHandle {
        #[allow(clippy::expect_used)]
        APP_HANDLE.get().expect("App handle not initialized")
    }

    pub fn set_is_exiting(&self) {
        self.is_exiting.store(true, Ordering::Release);
    }

    pub fn is_exiting(&self) -> bool {
        self.is_exiting.load(Ordering::Acquire)
    }

    pub fn get_main_window(&self) -> Option<WebviewWindow> {
        let window = Self::app_handle().get_webview_window("main");
        if window.is_none() {
            logging!(debug, Type::Window, "main window not found");
        }
        window
    }

    /// update the system tray state
    pub async fn update_systray_part() -> Result<()> {
        Tray::update_part().await?;
        Ok(())
    }

    /// update the system tray state & emit event
    pub async fn update_systray_part_with_emit(event: &str, version: &str) -> Result<()> {
        Tray::update_part_with_emit(event, version).await?;
        Ok(())
    }
}

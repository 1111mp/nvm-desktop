use crate::{APP_HANDLE, logging, utils::logging::Type};
use anyhow::Result;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{AppHandle, Emitter, Manager, WebviewWindow};

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

    /// update the system tray state & emit event
    pub async fn update_tray_part_and_emit(event: &str, payload: &str) -> Result<()> {
        super::tray::Tray::global().update_menu().await?;
        if let Some(window) = Self::global().get_main_window() {
            window.emit(event, payload)?;
        }
        Ok(())
    }
}

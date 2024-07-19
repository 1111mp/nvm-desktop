use crate::utils::{dirs, help};

use anyhow::Result;
use get_node::Proxy;
use serde::{Deserialize, Serialize};

#[derive(Default, Debug, Clone, Deserialize, Serialize)]
pub struct ISettings {
    /// whether to exit the program or minimize when clicking the close button
    /// value: `minimize` or `close`
    pub closer: Option<String>,

    /// installation directory
    pub directory: Option<String>,

    /// not show the window on launch
    pub enable_silent_start: Option<bool>,

    /// language
    /// `en` or `zh-CN`
    pub locale: Option<String>,

    /// download url
    pub mirror: Option<String>,

    /// proxy ip & ip
    pub proxy: Option<Proxy>,

    /// disable proxy
    /// valid with system proxy mode
    /// invalid with `TUN` proxy mode
    pub no_proxy: Option<bool>,

    /// app theme
    /// `system` or `light` or `dark`
    pub theme: Option<String>,
}

impl ISettings {
    pub fn new() -> Self {
        match dirs::settings_path().and_then(|path| help::read_json::<Self>(&path)) {
            Ok(settings) => settings,
            Err(err) => {
                log::error!(target: "app", "{err}");
                Self::template()
            }
        }
    }

    /// return the default settings config
    pub fn template() -> Self {
        Self {
            directory: Some(dirs::default_install_dir().to_string_lossy().to_string()),
            enable_silent_start: Some(false),
            locale: Some("en".into()),
            proxy: None,
            mirror: Some("https://nodejs.org/dist".into()),
            no_proxy: Some(false),
            theme: Some("system".into()),
            ..Self::default()
        }
    }

    pub fn save_file(&self) -> Result<()> {
        help::save_json(&dirs::settings_path()?, self, None)
    }

    /// get the value of `directory`
    pub fn get_closer(&self) -> Option<String> {
        self.closer.clone()
    }

    /// get the value of `directory`
    pub fn get_directory(&self) -> Option<String> {
        self.directory.clone()
    }

    /// get the value of `mirror`
    pub fn get_mirror(&self) -> Option<String> {
        self.mirror.clone()
    }

    // get the value of `proxy`
    pub fn get_proxy(&self) -> Option<Proxy> {
        self.proxy.clone()
    }

    // get the value of `no_proxy`
    pub fn get_no_proxy(&self) -> Option<bool> {
        self.no_proxy.clone()
    }

    /// update settings config
    /// save to file
    pub fn patch_settings(&mut self, patch: ISettings) -> Result<()> {
        macro_rules! patch {
            ($key: tt) => {
                if patch.$key.is_some() {
                    self.$key = patch.$key;
                }
            };
        }

        patch!(closer);
        patch!(directory);
        patch!(enable_silent_start);
        patch!(locale);
        patch!(mirror);
        patch!(proxy);
        patch!(no_proxy);
        patch!(theme);

        self.save_file()
    }
}

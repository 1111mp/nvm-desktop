use crate::utils::{dirs, help};

use anyhow::Result;
use get_node::Proxy;
use serde::{Deserialize, Serialize};

#[derive(Default, Debug, Clone, Deserialize, Serialize)]
pub struct ISettings {
    /// whether to exit the program or minimize when clicking the close button
    /// value: `minimize` or `close`
    pub closer: Option<String>,

    /// open the project file using the code editor
    /// designed by default for VSCode's 'code' command
    #[serde(default = "default_coder")]
    pub coder: Option<String>,

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

#[cfg(windows)]
fn default_coder() -> Option<String> {
    Some("code.cmd".to_string())
}

#[cfg(unix)]
fn default_coder() -> Option<String> {
    Some("code".to_string())
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
            closer: Some("minimize".into()),
            coder: default_coder(),
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

    /// get the value of `locale`
    pub fn get_locale(&self) -> Option<String> {
        self.locale.clone()
    }

    /// get the value of `closer`
    pub fn get_closer(&self) -> Option<String> {
        self.closer.clone()
    }

    /// get the value of `directory`
    pub fn get_directory(&self) -> Option<String> {
        self.directory.clone()
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
        patch!(coder);
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

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ISettingsResponse {
    pub closer: Option<String>,
    pub coder: Option<String>,
    pub directory: Option<String>,
    pub enable_silent_start: Option<bool>,
    pub locale: Option<String>,
    pub mirror: Option<String>,
    pub proxy: Option<Proxy>,
    pub no_proxy: Option<bool>,
    pub theme: Option<String>,
}

impl From<ISettings> for ISettingsResponse {
    fn from(settings: ISettings) -> Self {
        Self {
            closer: settings.closer,
            coder: settings.coder,
            directory: settings.directory,
            enable_silent_start: settings.enable_silent_start,
            locale: settings.locale,
            mirror: settings.mirror,
            proxy: settings.proxy,
            no_proxy: settings.no_proxy,
            theme: settings.theme,
        }
    }
}

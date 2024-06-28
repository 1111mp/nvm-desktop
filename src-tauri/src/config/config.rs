use super::{Draft, INode};
use crate::config::ISettings;

use once_cell::sync::OnceCell;

pub struct Config {
    node_config: Draft<INode>,
    setting_config: Draft<ISettings>,
}

impl Config {
    pub fn global() -> &'static Config {
        static CONFIG: OnceCell<Config> = OnceCell::new();

        CONFIG.get_or_init(|| {
            let setting_config = Draft::from(ISettings::new());
            let directory = setting_config.data().directory.clone();
            Config {
                node_config: Draft::from(INode::new(directory)),
                setting_config,
            }
        })
    }

    pub fn node() -> Draft<INode> {
        Self::global().node_config.clone()
    }

    pub fn settings() -> Draft<ISettings> {
        Self::global().setting_config.clone()
    }
}

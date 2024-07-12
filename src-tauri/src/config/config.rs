use super::{Draft, IGroups, INode, IProjects, ISettings};

use once_cell::sync::OnceCell;

pub struct Config {
    node_config: Draft<INode>,
    group_config: Draft<IGroups>,
    project_config: Draft<IProjects>,
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
                group_config: Draft::from(IGroups::new()),
                project_config: Draft::from(IProjects::new()),
                setting_config,
            }
        })
    }

    pub fn node() -> Draft<INode> {
        Self::global().node_config.clone()
    }

    pub fn groups() -> Draft<IGroups> {
        Self::global().group_config.clone()
    }

    pub fn projects() -> Draft<IProjects> {
        Self::global().project_config.clone()
    }

    pub fn settings() -> Draft<ISettings> {
        Self::global().setting_config.clone()
    }
}

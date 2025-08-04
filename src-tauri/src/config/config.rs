use super::{Draft, IGroups, INode, IProjects, ISettings};
use once_cell::sync::OnceCell;

pub struct Config {
    node_config: Draft<Box<INode>>,
    group_config: Draft<Box<IGroups>>,
    project_config: Draft<Box<IProjects>>,
    setting_config: Draft<Box<ISettings>>,
}

impl Config {
    pub fn global() -> &'static Config {
        static CONFIG: OnceCell<Config> = OnceCell::new();

        CONFIG.get_or_init(|| {
            let setting_config = Draft::from(Box::new(ISettings::new()));
            let directory = setting_config.data_ref().directory.clone();
            Config {
                node_config: Draft::from(Box::new(INode::new(directory))),
                group_config: Draft::from(Box::new(IGroups::new())),
                project_config: Draft::from(Box::new(IProjects::new())),
                setting_config,
            }
        })
    }

    pub fn node() -> Draft<Box<INode>> {
        Self::global().node_config.clone()
    }

    pub fn groups() -> Draft<Box<IGroups>> {
        Self::global().group_config.clone()
    }

    pub fn projects() -> Draft<Box<IProjects>> {
        Self::global().project_config.clone()
    }

    pub fn settings() -> Draft<Box<ISettings>> {
        Self::global().setting_config.clone()
    }
}

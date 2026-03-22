use super::{Draft, IGroups, INode, IProjects, ISettings};
use tokio::sync::OnceCell;

pub struct Config {
    node_config: Draft<INode>,
    group_config: Draft<IGroups>,
    project_config: Draft<IProjects>,
    setting_config: Draft<ISettings>,
}

impl Config {
    pub async fn global() -> &'static Config {
        static CONFIG: OnceCell<Config> = OnceCell::const_new();
        CONFIG
            .get_or_init(|| async {
                let setting_config = Draft::new(ISettings::new().await);
                let directory = {
                    let settings = setting_config.data_arc();
                    settings.get_directory()
                };
                Config {
                    node_config: Draft::new(INode::new(directory).await),
                    group_config: Draft::new(IGroups::new().await),
                    project_config: Draft::new(IProjects::new().await),
                    setting_config: setting_config,
                }
            })
            .await
    }

    pub async fn node() -> Draft<INode> {
        Self::global().await.node_config.clone()
    }

    pub async fn groups() -> Draft<IGroups> {
        Self::global().await.group_config.clone()
    }

    pub async fn projects() -> Draft<IProjects> {
        Self::global().await.project_config.clone()
    }

    pub async fn settings() -> Draft<ISettings> {
        Self::global().await.setting_config.clone()
    }
}

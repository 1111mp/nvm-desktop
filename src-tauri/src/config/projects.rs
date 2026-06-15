use crate::{
    logging,
    utils::{dirs, help, logging::Type},
};
use anyhow::{Result, bail};
use serde::{Deserialize, Serialize};

#[derive(Debug, Default, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    /// is it active
    pub active: bool,

    /// project name
    pub name: String,

    /// project path
    pub path: String,

    /// the node version of project used
    pub version: Option<String>,

    /// create date
    pub create_at: Option<String>,

    /// update date
    pub update_at: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct IProjects {
    /// projects list
    pub list: Option<Vec<Project>>,
}

impl Default for IProjects {
    fn default() -> Self {
        Self { list: Some(vec![]) }
    }
}

impl IProjects {
    pub async fn new() -> Self {
        let path = match dirs::projects_path() {
            Ok(p) => p,
            Err(err) => {
                logging!(error, Type::Config, "{err}");
                return Self::default();
            }
        };

        match help::read_json::<Vec<Project>>(&path).await {
            Ok(projects) => Self {
                list: Some(projects),
            },
            Err(err) => {
                logging!(error, Type::Config, "{err}");
                Self::default()
            }
        }
    }

    pub fn patch(&mut self, patch: &Self) {
        macro_rules! patch {
            ($key: tt) => {
                if patch.$key.is_some() {
                    self.$key = patch.$key.clone();
                }
            };
        }

        patch!(list);
    }

    pub fn extend(&mut self, mut projects: Vec<Project>) {
        let list = self.list.get_or_insert_with(Vec::new);
        projects.append(list);
        *list = projects;
    }

    /// get list
    pub fn get_list(&self) -> Option<Vec<Project>> {
        self.list.clone()
    }

    /// save project list to local file
    pub async fn save_file(&self) -> Result<()> {
        help::save_json(&dirs::projects_path()?, &self.list, None).await
    }

    /// update project list
    pub fn update_list(&mut self, list: Vec<Project>) {
        self.list = Some(list);
    }

    /// update project version for system tray menu
    pub fn update_version(&mut self, name: &str, version: &str) -> Result<String> {
        let list = self.list.get_or_insert_with(Vec::new);
        for item in list.iter_mut() {
            if item.name == name {
                item.version = Some(version.to_string());
                return Ok(item.path.clone());
            }
        }
        bail!("failed to find the project item \"name:{name}\"");
    }
}

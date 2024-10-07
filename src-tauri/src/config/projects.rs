use crate::utils::{dirs, help};
use anyhow::{bail, Result};
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

#[derive(Debug, Default, Clone, Deserialize, Serialize)]
pub struct IProjects {
    /// projects list
    pub list: Option<Vec<Project>>,
}

impl IProjects {
    pub fn new() -> Self {
        match dirs::projects_path().and_then(|path| help::read_json::<Vec<Project>>(&path)) {
            Ok(projects) => Self {
                list: Some(projects),
            },
            Err(err) => {
                log::error!(target: "app", "{err}");
                Self::template()
            }
        }
    }

    /// return the default data
    pub fn template() -> Self {
        Self { list: Some(vec![]) }
    }

    /// get list
    pub fn get_list(&self) -> Option<Vec<Project>> {
        self.list.clone()
    }

    /// save project list to local file
    pub fn save_file(&self) -> Result<()> {
        help::save_json(&dirs::projects_path()?, &self.list, None)
    }

    /// update project list
    pub fn update_list(&mut self, list: &Vec<Project>) -> Result<()> {
        self.list = Some(list.clone());
        Ok(())
    }

    /// update project version for system tray menu
    pub fn update_version(&mut self, name: &str, version: &str) -> Result<String> {
        let mut list = self.list.take().unwrap_or_default();

        for each in list.iter_mut() {
            if each.name == name {
                each.version = Some(version.to_string());
                let path = each.path.clone();
                self.list = Some(list);
                return Ok(path);
            }
        }

        self.list = Some(list);
        bail!("failed to find the project item \"name:{name}\"");
    }
}

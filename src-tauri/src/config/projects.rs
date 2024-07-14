use crate::utils::{dirs, help};
use anyhow::Result;
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
    pub create_at: String,

    /// update date
    pub update_at: String,
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

    /// save project list to local file
    pub fn save_file(&self) -> Result<()> {
        help::save_json(&dirs::projects_path()?, &self.list, None)
    }

    /// update project list
    pub fn update_list(&mut self, list: &Vec<Project>) -> Result<()> {
        self.list = Some(list.clone());
        Ok(())
    }

    /// update & save project list
    pub fn update_and_save_list(&mut self, list: Vec<Project>) -> Result<()> {
        self.list = Some(list);
        self.save_file()
    }
}

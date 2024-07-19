use crate::utils::{dirs, help};
use anyhow::Result;
use serde::{Deserialize, Serialize};

#[derive(Debug, Default, Clone, Deserialize, Serialize)]
pub struct Group {
    /// group name
    pub name: String,

    /// group desc
    pub desc: Option<String>,

    /// the group contains projects
    #[serde(default = "default_projects")]
    pub projects: Vec<String>,

    /// the node version of group used
    pub version: Option<String>,
}

fn default_projects() -> Vec<String> {
    vec![]
}

#[derive(Debug, Default, Clone, Deserialize, Serialize)]
pub struct IGroups {
    /// projects list
    pub list: Option<Vec<Group>>,
}

impl IGroups {
    pub fn new() -> Self {
        match dirs::groups_path().and_then(|path| help::read_json::<Vec<Group>>(&path)) {
            Ok(groups) => Self { list: Some(groups) },
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

    /// save group list to local file
    pub fn save_file(&self) -> Result<()> {
        help::save_json(&dirs::groups_path()?, &self.list, None)
    }

    /// get list
    pub fn get_list(&self) -> Option<Vec<Group>> {
        self.list.clone()
    }

    /// update groups list
    pub fn update_list(&mut self, list: &Vec<Group>) -> Result<()> {
        self.list = Some(list.clone());
        Ok(())
    }

    /// update groups list & save to local file
    pub fn update_groups(&mut self, list: Vec<Group>) -> Result<()> {
        self.list = Some(list);
        self.save_file()
    }
}

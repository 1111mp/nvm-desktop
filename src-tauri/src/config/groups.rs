use crate::utils::{dirs, help};
use anyhow::Result;
use serde::{Deserialize, Serialize};

#[derive(Debug, Default, Clone, Deserialize, Serialize)]
pub struct Group {
    /// group name
    pub name: String,

    /// group desc
    pub desc: String,

    /// the group contains projects
    #[serde(default = "default_projects")]
    pub projects: Vec<String>,

    /// the node version of group used
    pub version: String,
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

    /// update project list
    pub fn update_list(&mut self, list: &Vec<Group>) -> Result<()> {
        self.list = Some(list.clone());
        Ok(())
    }
}

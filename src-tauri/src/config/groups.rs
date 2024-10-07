use crate::utils::{dirs, help};
use anyhow::{bail, Result};
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

    /// update group version
    pub fn update_version(&mut self, name: String, version: String) -> Result<()> {
        let mut list = self.list.take().unwrap_or_default();

        for each in list.iter_mut() {
            if each.name == name {
                each.version = Some(version.clone());

                self.list = Some(list);

                return Ok(());
            }
        }

        self.list = Some(list);
        bail!("failed to find the group item \"name:{name}\"");
    }

    /// update the projects of group for system tray menu
    pub fn update_projects(&mut self, path: &String) -> Result<bool> {
        let mut list = self.list.take().unwrap_or_default();

        for each in list.iter_mut() {
            if each.projects.contains(path) {
                each.projects.retain(|p| p != path);

                self.list = Some(list);
                return Ok(true);
            }
        }

        self.list = Some(list);
        Ok(false)
    }

    /// update the projects of group for system tray menu
    /// remove from old group
    /// add to new group
    pub fn update_projects_version(&mut self, path: &str, name: &str) -> Result<Option<String>> {
        let mut list = self.list.take().unwrap_or_default();
        let mut version: Option<String> = None;

        for each in list.iter_mut() {
            if each.projects.contains(&path.to_string()) {
                each.projects.retain(|p| p != path);
            }

            if &each.name == name {
                version = each.version.clone();
                each.projects.push(path.to_string());
            }
        }

        self.list = Some(list);
        Ok(version)
    }
}

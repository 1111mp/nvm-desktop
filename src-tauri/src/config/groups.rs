use crate::{
    logging,
    utils::{dirs, help, logging::Type},
};
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
    pub async fn new() -> Self {
        let path = match dirs::groups_path() {
            Ok(p) => p,
            Err(err) => {
                logging!(error, Type::Config, "{err}");
                return Self::default();
            }
        };

        match help::read_json::<Vec<Group>>(&path).await {
            Ok(groups) => Self { list: Some(groups) },
            Err(err) => {
                logging!(error, Type::Config, "{err}");
                Self::default()
            }
        }
    }

    /// save group list to local file
    pub async fn save_file(&self) -> Result<()> {
        help::save_json(&dirs::groups_path()?, &self.list, None).await
    }

    /// get list
    pub fn get_list(&self) -> Option<Vec<Group>> {
        self.list.clone()
    }

    /// update groups list
    pub fn update_list(&mut self, list: Vec<Group>) {
        self.list = Some(list);
    }

    /// update group version
    pub fn update_version(&mut self, name: &str, version: &str) -> Result<()> {
        let list = self.list.get_or_insert_with(Vec::new);
        if let Some(group) = list.iter_mut().find(|g| g.name == name) {
            group.version = Some(version.to_string());
            return Ok(());
        }
        bail!("failed to find the group item \"name:{name}\"");
    }

    /// update the projects of group for system tray menu
    pub fn update_projects(&mut self, path: &str) -> Result<bool> {
        let list = self.list.get_or_insert_with(Vec::new);
        for group in list.iter_mut() {
            if group.projects.iter().any(|p| p == path) {
                group.projects.retain(|p| p != path);
                return Ok(true);
            }
        }
        Ok(false)
    }

    pub fn exsist(&self, name: &str) -> bool {
        self.list.as_ref().map_or(false, |groups| {
            groups.iter().any(|group| group.name == name)
        })
    }

    /// update the projects of group for system tray menu
    /// remove from old group
    /// add to new group
    pub fn update_projects_version(&mut self, path: &str, name: &str) -> Result<Option<String>> {
        let list = self.list.get_or_insert_with(Vec::new);
        for group in list.iter_mut() {
            group.projects.retain(|p| p != path);
        }
        if let Some(group) = list.iter_mut().find(|g| g.name == name) {
            let version = group.version.clone();
            group.projects.push(path.to_owned());
            return Ok(version);
        }

        Ok(None)
    }
}

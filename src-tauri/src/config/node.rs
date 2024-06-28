use crate::{
    node::NVersion,
    utils::{dirs, help},
};

use anyhow::Result;
use serde::{Deserialize, Serialize};

#[derive(Default, Debug, Clone, Deserialize, Serialize)]
pub struct INode {
    /// current node version
    pub current: Option<String>,

    /// node version list
    pub list: Option<Vec<NVersion>>,

    /// installed node versions
    pub installed: Option<Vec<String>>,
}

impl INode {
    pub fn new(directory: Option<String>) -> Self {
        // get current version from `default`
        let current = dirs::default_version_path()
            .and_then(|path| help::read_string(&path))
            .map(Some)
            .unwrap_or_else(|err| {
                log::error!(target: "app", "{err}");
                None
            });
        // get list from `versions.json`
        let list = dirs::version_list_path()
            .and_then(|path| help::read_json::<Vec<NVersion>>(&path))
            .map(Some)
            .unwrap_or_else(|err| {
                log::error!(target: "app", "{err}");
                Some(vec![])
            });

        let installed = directory
            .map(|path| {
                Some(help::read_installed(&path).unwrap_or_else(|err| {
                    log::error!(target: "app", "{err}");
                    vec![]
                }))
            })
            .unwrap_or(Some(vec![]));

        Self {
            current,
            list,
            installed,
        }
    }

    /// return the default node config
    pub fn template() -> Self {
        Self {
            list: Some(vec![]),
            installed: Some(vec![]),
            ..Self::default()
        }
    }

    /// save list to file
    pub fn save_list_file(&self) -> Result<()> {
        help::save_json(&dirs::version_list_path()?, &self.list, None)
    }

    /// get current version
    pub fn get_current(&self) -> Option<String> {
        self.current.clone()
    }

    /// get version list
    pub fn get_list(&self) -> Option<Vec<NVersion>> {
        self.list.clone()
    }

    /// get installed
    pub fn get_installed(&self) -> Option<Vec<String>> {
        self.installed.clone()
    }

    /// update version list
    pub fn update_list(&mut self, list: &Vec<NVersion>) -> Result<()> {
        self.list = Some(list.clone());
        self.save_list_file()
    }

    /// update installed
    pub fn update_installed(&mut self, installed: &Vec<String>) -> Result<()> {
        self.installed = Some(installed.clone());
        Ok(())
    }
}

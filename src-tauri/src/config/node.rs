use crate::{
    core::node,
    logging,
    utils::{dirs, help, logging::Type},
};

use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::cmp::Ordering;
use version_compare::{compare, Cmp};

#[derive(Default, Debug, Clone, Deserialize, Serialize)]
pub struct NVersion {
    /// version release date
    pub date: String,

    /// long time support version
    /// String or bool
    pub lts: Option<Value>,

    /// openssl version
    pub openssl: Option<String>,

    /// npm version
    pub npm: Option<String>,

    /// v8 engine version
    pub v8: String,

    /// node version
    pub version: String,

    /// the downloadbable files with types
    pub files: Vec<String>,
}

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
    pub async fn new(directory: Option<String>) -> Self {
        // get current version from `default`
        let current_fut = async {
            match dirs::default_version_path() {
                Ok(path) => match help::read_string(&path).await {
                    Ok(v) => Some(v),
                    Err(err) => {
                        logging!(error, Type::Config, "{err}");
                        None
                    }
                },
                Err(err) => {
                    logging!(error, Type::Config, "{err}");
                    None
                }
            }
        };
        // get list from `versions.json`
        let list_fut = async {
            match dirs::version_list_path() {
                Ok(path) => match help::read_json::<Vec<NVersion>>(&path).await {
                    Ok(v) => Some(v),
                    Err(err) => {
                        logging!(error, Type::Config, "{err}");
                        Some(vec![])
                    }
                },
                Err(err) => {
                    logging!(error, Type::Config, "{err}");
                    Some(vec![])
                }
            }
        };
        // get had installed list
        let installed_fut = async {
            if let Some(path) = directory {
                match node::read_installed(&path).await {
                    Ok(v) => Some(v),
                    Err(err) => {
                        logging!(error, Type::Config, "{err}");
                        Some(vec![])
                    }
                }
            } else {
                Some(vec![])
            }
        };

        let (current, list, mut installed) = tokio::join!(current_fut, list_fut, installed_fut);
        if let Some(ref mut i) = installed {
            i.sort_by(|a, b| match compare(b, a) {
                Ok(Cmp::Lt) => Ordering::Less,
                Ok(Cmp::Eq) => Ordering::Equal,
                Ok(Cmp::Gt) => Ordering::Greater,
                _ => unreachable!(),
            });
        }

        Self {
            current,
            list,
            installed,
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

        patch!(current);
        patch!(list);
        patch!(installed);
    }

    /// save list to file
    pub async fn save_file(&self) -> Result<()> {
        help::save_json(&dirs::version_list_path()?, &self.list, None).await
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

    /// update current
    pub fn update_current(&mut self, current: Option<String>) {
        self.current = current;
    }

    /// update version list
    pub fn update_list(&mut self, list: Vec<NVersion>) {
        self.list = Some(list);
    }

    /// update installed
    pub fn update_installed(&mut self, installed: Vec<String>) {
        self.installed = Some(installed);
    }
}

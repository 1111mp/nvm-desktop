use serde::{Deserialize, Serialize};

pub mod archive;
pub mod list;
mod node;

#[derive(Debug, Default, Clone, Deserialize, Serialize)]
pub struct Proxy {
    pub enabled: bool,
    pub ip: String,
    pub port: String,
}

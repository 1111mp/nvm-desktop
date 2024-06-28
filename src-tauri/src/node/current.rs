use anyhow::Result;

use crate::config::Config;

pub fn get_current() -> Result<Option<String>> {
    Ok(Config::node().data().get_current())
}

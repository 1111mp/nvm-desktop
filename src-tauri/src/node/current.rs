use anyhow::Result;

use crate::config::Config;

pub fn get_current() -> Result<Option<String>> {
    Ok(Config::node().latest().get_current())
}

use anyhow::Result;
use dirs::home_dir;
use std::path::PathBuf;

static APP_ID: &str = ".nvmd";

/// get the nvmd home dir
pub fn app_home_dir() -> Result<PathBuf> {
    Ok(home_dir()
        .ok_or(anyhow::anyhow!("failed to get app home dir"))?
        .join(APP_ID))
}

/// get the setting path
pub fn settings_path() -> Result<PathBuf> {
    Ok(app_home_dir()?.join("setting.json"))
}

/// get the default version path
pub fn default_version_path() -> Result<PathBuf> {
    Ok(app_home_dir()?.join("default"))
}

/// get the version list path
pub fn version_list_path() -> Result<PathBuf> {
    Ok(app_home_dir()?.join("versions.json"))
}

/// get the default install directory
pub fn default_install_dir() -> PathBuf {
    match app_home_dir() {
        Ok(home_dir) => home_dir.join("versions"),
        Err(_) => PathBuf::from(""),
    }
}

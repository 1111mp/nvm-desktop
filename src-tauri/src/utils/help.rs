use anyhow::{bail, Context, Result};
use serde::{de::DeserializeOwned, Serialize};
use std::{fs, path::PathBuf};

pub fn read_string(path: &PathBuf) -> Result<String> {
    fs::read_to_string(path)
        .with_context(|| format!("failed to read the file \"{}\"", path.display()))
}

/// read data from json as struct T
pub fn read_json<T: DeserializeOwned>(path: &PathBuf) -> Result<T> {
    if !path.exists() {
        bail!("file not found \"{}\"", path.display());
    }

    let json_str = fs::read_to_string(path)
        .with_context(|| format!("failed to read the file \"{}\"", path.display()))?;

    serde_json::from_str::<T>(&json_str).with_context(|| {
        format!(
            "failed to read the file with json format \"{}\"",
            path.display()
        )
    })
}

/// save the data to the file
/// can set `prefix` string to add some comments
pub fn save_json<T: Serialize>(path: &PathBuf, data: &T, prefix: Option<&str>) -> Result<()> {
    let data_str = serde_json::to_string(data)?;

    let json_str = match prefix {
        Some(prefix) => format!("{prefix}\n\n{data_str}"),
        None => data_str,
    };

    let path_str = path.as_os_str().to_string_lossy().to_string();
    fs::write(path, json_str.as_bytes())
        .with_context(|| format!("failed to save file \"{path_str}\""))
}

/// read node installed version list
pub fn read_installed(path: &String) -> Result<Vec<String>> {
    let directory = PathBuf::from(path);
    if !directory.exists() {
        return Ok(vec![]);
    }

    let mut versions = vec![];
    for entry in fs::read_dir(&directory)? {
        let entry = entry?;
        let version = entry.file_name().to_string_lossy().to_string();
        let node_path = directory.clone();
        #[cfg(target_os = "windows")]
        let node_path = node_path.join(&version).join("node.exe");
        #[cfg(any(target_os = "macos", target_os = "linux"))]
        let node_path = node_path.join(&version).join("bin/node");
        if node_path.exists() {
            versions.push(version);
        }
    }

    Ok(versions)
}

#[macro_export]
macro_rules! log_err {
    ($result: expr) => {
        if let Err(err) = $result {
            log::error!(target: "app", "{err}");
        }
    };

    ($result: expr, $err_str: expr) => {
        if let Err(_) = $result {
            log::error!(target: "app", "{}", $err_str);
        }
    };
}

#[macro_export]
macro_rules! trace_err {
    ($result: expr, $err_str: expr) => {
        if let Err(err) = $result {
            log::trace!(target: "app", "{}, err {}", $err_str, err);
        }
    }
}

/// wrap the anyhow error
/// transform the error to String
#[macro_export]
macro_rules! wrap_err {
    ($stat: expr) => {
        match $stat {
            Ok(a) => Ok(a),
            Err(err) => {
                log::error!(target: "app", "{}", err.to_string());
                Err(format!("{}", err.to_string()))
            }
        }
    };
}

/// return the string literal error
#[macro_export]
macro_rules! ret_err {
    ($str: expr) => {
        return Err($str.into())
    };
}

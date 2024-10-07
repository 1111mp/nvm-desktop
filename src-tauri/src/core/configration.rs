use super::{handle, project::sync_project_version};
use crate::config::{Config, Group, ISettings, Project};
use anyhow::{bail, Result};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{Emitter, Manager};
use tauri_plugin_dialog::{DialogExt, FilePath};

#[derive(Default, Debug, Deserialize, Serialize)]
pub struct ConfigrationExport {
    /// theme color
    color: Option<String>,

    /// export setting data
    setting: Option<bool>,

    /// export mirrors data
    mirrors: Option<String>,

    /// export projects data (include groups)
    projects: Option<bool>,
}

#[derive(Default, Debug, Deserialize, Serialize)]
pub struct ConfigrationData {
    /// theme color
    color: Option<String>,

    /// export setting data
    setting: Option<ISettings>,

    /// export mirrors data
    mirrors: Option<String>,

    /// export projects data
    projects: Option<Vec<Project>>,

    /// export groups data
    groups: Option<Vec<Group>>,
}

#[derive(Default, Serialize)]
pub struct ConfigrationImport {
    /// theme color
    color: Option<String>,

    /// export setting data
    setting: Option<ISettings>,

    /// export mirrors data
    mirrors: Option<String>,
}

/// configration export
pub async fn configration_export(
    output_path: PathBuf,
    configration: ConfigrationExport,
) -> Result<()> {
    let ConfigrationExport {
        color,
        setting,
        mirrors,
        projects,
    } = configration;

    let mut output = ConfigrationData::default();

    // export theme color
    if let Some(color) = color {
        output.color = Some(color);
    }

    // export setting & mirrors data
    if setting.unwrap_or(false) {
        output.setting = Some(Config::settings().latest().clone());
        output.mirrors = mirrors;
    }

    // export projects & groups data
    if projects.unwrap_or(false) {
        output.projects = Config::projects().latest().get_list();
        output.groups = Config::groups().latest().get_list();
    }

    let output_json = serde_json::to_string_pretty(&output)?;
    tokio::fs::write(output_path, output_json).await?;

    Ok(())
}

/// configration import
pub async fn configration_import(
    app_handle: &tauri::AppHandle,
    sync: bool,
) -> Result<Option<ConfigrationImport>> {
    if let Some(file_path) = app_handle
        .dialog()
        .file()
        .add_filter("Select Json", &["json"])
        .blocking_pick_file()
    {
        let data = match file_path {
            FilePath::Path(path) => tokio::fs::read_to_string(path).await?,
            FilePath::Url(_) => bail!("Unsupported URL scheme"),
        };

        let configration: ConfigrationData = serde_json::from_str(&data)?;
        let projects = configration.projects.unwrap_or_default();
        let groups = configration.groups.unwrap_or_default();

        // need sync node version for every project
        if sync {
            for project in &projects {
                let mut version = project.version.clone();
                // If the project's version matches any group's name, use the group's version
                if let Some(ref project_version) = version {
                    if let Some(group) = groups.iter().find(|g| g.name == *project_version) {
                        version = group.version.clone();
                    }
                }

                if let Some(version) = version {
                    sync_project_version(PathBuf::from(&project.path), &version).await?;
                }
            }
        }

        let need_update_projects = !projects.is_empty();
        let need_update_groups = !groups.is_empty();
        // update projects data
        if need_update_projects {
            Config::projects().draft().update_list(&projects)?;
            Config::projects().apply();
            Config::projects().data().save_file()?;
        }
        // update groups data
        if need_update_groups {
            Config::groups().draft().update_list(&groups)?;
            Config::groups().apply();
            Config::groups().data().save_file()?;
        }
        // update system tray & notification page refresh data
        if need_update_projects || need_update_groups {
            handle::Handle::update_systray_part()?;
            if let Some(window) = app_handle.get_webview_window("main") {
                window.emit("call-projects-update", ())?;
            }
        }

        return Ok(Some(ConfigrationImport {
            color: configration.color,
            setting: configration.setting,
            mirrors: configration.mirrors,
        }));
    }

    Ok(None)
}

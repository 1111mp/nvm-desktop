use super::{handle, project::sync_project_version};
use crate::{
    config::{Config, Group, ISettingsResponse, Project},
    log_err,
    utils::help::{async_read_json, async_save_json},
};
use anyhow::{bail, Result};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{Emitter, Manager};
use tauri_plugin_dialog::{DialogExt, FilePath};

#[derive(Default, Debug, Deserialize, Serialize)]
pub struct ConfigurationExport {
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
pub struct ConfigurationData {
    /// theme color
    color: Option<String>,

    /// export setting data
    setting: Option<ISettingsResponse>,

    /// export mirrors data
    mirrors: Option<String>,

    /// export projects data
    projects: Option<Vec<Project>>,

    /// export groups data
    groups: Option<Vec<Group>>,
}

#[derive(Default, Serialize)]
pub struct ConfigurationImport {
    /// theme color
    color: Option<String>,

    /// export setting data
    setting: Option<ISettingsResponse>,

    /// export mirrors data
    mirrors: Option<String>,
}

/// configuration export
pub async fn configuration_export(
    output_path: PathBuf,
    configuration: ConfigurationExport,
) -> Result<()> {
    let ConfigurationExport {
        color,
        setting,
        mirrors,
        projects,
    } = configuration;

    let mut output = ConfigurationData::default();
    // export theme color
    if let Some(color) = color {
        output.color = Some(color);
    }
    // export setting & mirrors data
    if setting.unwrap_or(false) {
        let setting_data = Config::settings().latest_ref().clone();
        output.setting = Some(ISettingsResponse::from(*setting_data));
        output.mirrors = mirrors;
    }
    // export projects & groups data
    if projects.unwrap_or(false) {
        output.projects = Config::projects().latest_ref().get_list();
        output.groups = Config::groups().latest_ref().get_list();
    }
    async_save_json(&output_path, &output, None).await?;

    Ok(())
}

/// configuration import
pub async fn configuration_import(
    app_handle: &tauri::AppHandle,
    sync: bool,
) -> Result<Option<ConfigurationImport>> {
    if let Some(file_path) = app_handle
        .dialog()
        .file()
        .add_filter("Select Json", &["json"])
        .blocking_pick_file()
    {
        let path = match file_path {
            FilePath::Path(path) => path,
            FilePath::Url(_) => bail!("Unsupported URL scheme"),
        };
        let configuration = async_read_json::<ConfigurationData>(&path).await?;
        let projects = configuration.projects.unwrap_or_default();
        let groups = configuration.groups.unwrap_or_default();

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
            Config::projects().draft_mut().update_list(&projects)?;
            Config::projects().apply();
            Config::projects().data_mut().save_file()?;
        }
        // update groups data
        if need_update_groups {
            Config::groups().data_mut().update_list(&groups)?;
            Config::groups().apply();
            Config::groups().data_mut().save_file()?;
        }
        // update system tray & notification page refresh data
        if need_update_projects || need_update_groups {
            log_err!(handle::Handle::update_systray_part());
            if let Some(window) = app_handle.get_webview_window("main") {
                window.emit("nvm-desktop://refresh-project-info", ())?;
            }
        }

        return Ok(Some(ConfigurationImport {
            color: configuration.color,
            setting: configuration.setting,
            mirrors: configuration.mirrors,
        }));
    }

    Ok(None)
}

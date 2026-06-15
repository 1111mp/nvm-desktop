use crate::{
    config::{Config, Group, ISettingsResponse, Project},
    log_err, logging,
    utils::{help, logging::Type},
};
use anyhow::{Result, bail};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{Emitter, Manager};
use tauri_plugin_dialog::{DialogExt, FilePath};

#[derive(Default, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfigurationExport {
    /// base color
    base_color: Option<String>,

    /// theme color
    color: Option<String>,

    /// radius
    radius: Option<String>,

    /// export setting data
    setting: Option<bool>,

    /// export mirrors data
    mirrors: Option<String>,

    /// export projects data (include groups)
    projects: Option<bool>,
}

#[derive(Default, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfigurationData {
    /// base color
    base_color: Option<String>,

    /// theme color
    color: Option<String>,

    /// radius
    radius: Option<String>,

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
#[serde(rename_all = "camelCase")]
pub struct ConfigurationImport {
    /// base color
    #[serde(skip_serializing_if = "Option::is_none")]
    base_color: Option<String>,

    /// theme color
    #[serde(skip_serializing_if = "Option::is_none")]
    color: Option<String>,

    /// radius
    #[serde(skip_serializing_if = "Option::is_none")]
    radius: Option<String>,

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
        base_color,
        color,
        radius,
        setting,
        mirrors,
        projects,
    } = configuration;

    let mut output = ConfigurationData::default();
    // export base color
    output.base_color = base_color;
    // export theme color
    output.color = color;
    // export radius
    output.radius = radius;
    // export setting & mirrors data
    if setting.unwrap_or(false) {
        let setting_data = Config::settings().await.data_arc();
        output.setting = Some(setting_data.into_response());
        output.mirrors = mirrors;
    }
    // export projects & groups data
    if projects.unwrap_or(false) {
        output.projects = Config::projects().await.data_arc().get_list();
        output.groups = Config::groups().await.data_arc().get_list();
    }
    help::save_json(&output_path, &output, None).await?;

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
        let configuration = help::read_json::<ConfigurationData>(&path).await?;
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
                    super::project::sync_project_version(PathBuf::from(&project.path), &version)
                        .await?;
                }
            }
        }

        let need_update_projects = !projects.is_empty();
        let need_update_groups = !groups.is_empty();
        // update projects data
        if need_update_projects {
            Config::projects()
                .await
                .edit_draft(|d| d.update_list(projects));

            Config::projects().await.apply();
            let projects_data = Config::projects().await.data_arc();
            logging!(debug, Type::Cmd, "Saving Projects data to file...");
            projects_data.save_file().await?;
        }
        // update groups data
        if need_update_groups {
            Config::groups().await.edit_draft(|d| d.update_list(groups));

            Config::groups().await.apply();
            let groups_data = Config::groups().await.data_arc();
            logging!(debug, Type::Cmd, "Saving Group data to file...");
            groups_data.save_file().await?;
        }
        // update system tray & notification page refresh data
        if need_update_projects || need_update_groups {
            log_err!(super::tray::Tray::global().update_part().await);
            if let Some(window) = app_handle.get_webview_window("main") {
                window.emit("nvm-desktop://refresh-project-info", ())?;
            }
        }

        return Ok(Some(ConfigurationImport {
            base_color: configuration.base_color,
            color: configuration.color,
            radius: configuration.radius,
            setting: configuration.setting,
            mirrors: configuration.mirrors,
        }));
    }

    Ok(None)
}

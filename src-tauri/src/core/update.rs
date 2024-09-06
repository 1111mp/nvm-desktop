use anyhow::Result;
use tauri_plugin_updater::UpdaterExt;

/// app check update
pub async fn app_check_update(app_handle: &tauri::AppHandle) -> Result<()> {
    if let Some(update) = app_handle.updater()?.check().await? {
        let mut downloaded = 0;

        // alternatively we could also call update.download() and update.install() separately
        update
            .download_and_install(
                |chunk_length, content_length| {
                    downloaded += chunk_length;
                    log::info!("downloaded {downloaded} from {content_length:?}");
                },
                || {
                    log::info!("download finished");
                },
            )
            .await?;

        log::info!("update installed");
        app_handle.restart();
    }

    Ok(())
}

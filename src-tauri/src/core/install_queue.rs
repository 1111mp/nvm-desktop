use crate::config::Config;
use anyhow::{Result, bail};
use get_node::archive::{FetchConfig, fetch_native};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::Emitter;
use tokio::sync::watch;

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallRequest {
    pub version: String,
    pub arch: String,
    #[serde(default)]
    pub directory: Option<String>,
    #[serde(default)]
    pub batch_id: Option<u64>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallTask {
    pub id: u64,
    pub batch_id: u64,
    pub version: String,
    pub arch: String,
    pub directory: String,
    pub phase: String,
    pub transferred: usize,
    pub total: usize,
    pub error: Option<String>,
    pub path: Option<String>,
    pub revision: u64,
    #[serde(skip)]
    cancel: watch::Sender<bool>,
    #[serde(skip)]
    legacy: bool,
}

impl InstallTask {
    pub fn active(&self) -> bool {
        !matches!(self.phase.as_str(), "complete" | "failed" | "cancelled")
    }
}

pub static ADMISSION: tokio::sync::Mutex<()> = tokio::sync::Mutex::const_new(());

static TASKS: Lazy<Mutex<Vec<InstallTask>>> = Lazy::new(|| Mutex::new(Vec::new()));

pub fn snapshot() -> Vec<InstallTask> {
    TASKS.lock().unwrap().clone()
}

pub fn busy() -> bool {
    TASKS.lock().unwrap().iter().any(InstallTask::active)
}

fn update(window: &tauri::Window, id: u64, edit: impl FnOnce(&mut InstallTask)) {
    let mut tasks = TASKS.lock().unwrap();
    if let Some(task) = tasks.iter_mut().find(|task| task.id == id) {
        edit(task);
        task.revision += 1;
        // Emit while holding the lock so a snapshot cannot overtake this update.
        let _ = window.emit("nvm-desktop://install-task", task.clone());
    }
}

fn validate_requests(
    requests: &[InstallRequest],
    directory: &str,
    tasks: &[InstallTask],
    legacy: bool,
) -> Result<()> {
    if legacy && tasks.iter().any(|task| task.legacy && task.active()) {
        bail!("A single installation is already running");
    }
    for (index, request) in requests.iter().enumerate() {
        if request
            .directory
            .as_deref()
            .is_some_and(|expected| expected != directory)
        {
            bail!(
                "The installation directory has changed. Restore the task's original directory or start a new installation."
            );
        }
        if request.batch_id != requests[0].batch_id {
            bail!("All retry requests must belong to the same batch");
        }
        if let Some(batch_id) = request.batch_id {
            if !tasks.iter().any(|task| {
                task.batch_id == batch_id
                    && task.version == request.version
                    && task.arch == request.arch
                    && task.directory == directory
                    && matches!(task.phase.as_str(), "failed" | "cancelled")
            }) {
                bail!("The retry does not match a failed task in this batch");
            }
        }
        if request.version.split('.').count() != 3
            || !request
                .version
                .split('.')
                .all(|part| !part.is_empty() && part.chars().all(|c| c.is_ascii_digit()))
            || !matches!(request.arch.as_str(), "arm64" | "x64" | "x86")
        {
            bail!("Invalid version or architecture");
        }
        if requests[..index]
            .iter()
            .any(|other| other.version == request.version)
            || tasks.iter().any(|task| {
                task.active() && task.directory == directory && task.version == request.version
            })
        {
            bail!("Version {} is already queued", request.version);
        }
        if std::path::Path::new(&directory)
            .join(&request.version)
            .exists()
        {
            bail!("Version {} is already installed", request.version);
        }
    }
    Ok(())
}

pub async fn enqueue(
    window: tauri::Window,
    requests: Vec<InstallRequest>,
    legacy: bool,
) -> Result<Vec<InstallTask>> {
    let _admission = ADMISSION.lock().await;
    if requests.is_empty() {
        bail!("No versions selected");
    }
    let settings = Config::settings().await.data_arc();
    let directory = settings
        .get_directory()
        .ok_or_else(|| anyhow::anyhow!("Installation directory is missing"))?;
    let mirror = settings
        .mirror
        .clone()
        .ok_or_else(|| anyhow::anyhow!("Mirror is missing"))?;
    // Validate the entire batch before registering or starting any task.
    let mut tasks = TASKS.lock().unwrap();
    validate_requests(&requests, &directory, &tasks, legacy)?;
    // Use the first task ID as a stable batch ID. Retried attempts keep it so
    // their siblings remain visible; a new selection always starts a new batch.
    let batch_id = requests[0]
        .batch_id
        .unwrap_or_else(|| tasks.last().map_or(1, |task| task.id + 1));
    let mut added = Vec::new();
    for request in requests {
        let (cancel, receiver) = watch::channel(false);
        let task = InstallTask {
            id: tasks.last().map_or(1, |task| task.id + 1),
            batch_id,
            version: request.version.clone(),
            arch: request.arch.clone(),
            directory: directory.clone(),
            phase: "queued".into(),
            transferred: 0,
            total: 0,
            error: None,
            path: None,
            revision: 0,
            cancel,
            legacy,
        };
        tasks.push(task.clone());
        added.push(task.clone());
        let window = window.clone();
        let mirror = mirror.clone();
        let directory = directory.clone();
        let proxy = settings.proxy.clone();
        let no_proxy = settings.no_proxy;
        tauri::async_runtime::spawn(async move {
            let id = task.id;
            let signal = receiver.clone();
            let progress_window = window.clone();
            let throttle = Mutex::new((String::new(), std::time::Instant::now()));
            let result = fetch_native(FetchConfig {
                dest: directory,
                mirror,
                version: request.version,
                arch: Some(request.arch),
                proxy,
                no_proxy,
                cancel_signal: Some(receiver),
                connect_timeout: None,
                read_timeout: None,
                on_progress: Box::new(move |source, transferred, total| {
                    let mut last = throttle.lock().unwrap();
                    if last.0 == source && last.1.elapsed().as_millis() < 300 {
                        return;
                    }
                    *last = (source.into(), std::time::Instant::now());
                    update(&progress_window, id, |task| {
                        if !*task.cancel.borrow() {
                            task.phase = source.into();
                            if source == "download" {
                                task.transferred = transferred;
                                task.total = total;
                            }
                        }
                    });
                    // Keep the existing single-install dialog compatible without
                    // forwarding another task's progress into it.
                    if legacy && matches!(source, "download" | "unzip") {
                        let _ = progress_window.emit(
                            "nvm-desktop://node-download-progress",
                            super::node::ProgressData {
                                source,
                                transferred,
                                total,
                            },
                        );
                    }
                }),
            })
            .await;
            update(&window, id, |task| match result {
                Ok(path) => {
                    task.phase = "complete".into();
                    task.path = Some(path);
                }
                Err(error) => {
                    task.phase = if *signal.borrow() {
                        "cancelled"
                    } else {
                        "failed"
                    }
                    .into();
                    if !*signal.borrow() {
                        task.error = Some(error.to_string());
                    }
                }
            });
            let _ = super::node::fetch_installed_with_sync(Some(true)).await;
            let _ = window.emit("nvm-desktop://refresh-version-info", "");
        });
    }
    Ok(added)
}

pub fn cancel(window: &tauri::Window, id: Option<u64>, legacy_only: bool) {
    let ids: Vec<_> = snapshot()
        .into_iter()
        .filter(|task| {
            task.active() && id.is_none_or(|id| task.id == id) && (!legacy_only || task.legacy)
        })
        .map(|task| task.id)
        .collect();
    // Signal every task before yielding, including semaphore waiters. No queued
    // task can start downloading after a cancel-all request.
    for id in ids {
        update(window, id, |task| {
            // Completion can win the race after the cancellation snapshot.
            if task.active() {
                let _ = task.cancel.send(true);
                task.phase = "cancelling".into();
            }
        });
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn retry_batch_id_is_deserialized_from_frontend_camel_case() {
        let request: InstallRequest = serde_json::from_value(serde_json::json!({
            "version": "22.0.0", "arch": "x64", "batchId": 7
        }))
        .unwrap();
        assert_eq!(request.batch_id, Some(7));
        let fresh: InstallRequest = serde_json::from_value(serde_json::json!({
            "version": "22.0.0", "arch": "x64"
        }))
        .unwrap();
        assert_eq!(fresh.batch_id, None);
    }
}

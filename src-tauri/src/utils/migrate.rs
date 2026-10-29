use super::dirs;
use crate::utils::logging::Type;
use crate::{core::handle, logging_error, process::AsyncHandler};
use anyhow::{Context, Result, ensure};
use serde::{Deserialize, Serialize};
use std::{io::ErrorKind, path::Path};
use tauri::Emitter;
use tokio::fs;
use tokio::time::{Duration, sleep};

const NODE_DEFAULT_EXECUTE: [&str; 4] = ["node", "npm", "npx", "corepack"];

#[derive(Debug, Deserialize, Serialize, PartialEq, Eq)]
struct RuntimeManifest {
    format_version: u32,
    target: String,
    bundle_id: String,
}

pub fn init() {
    AsyncHandler::spawn(|| async {
        if let Err(err) = sync_runtime().await {
            logging_error!(Type::Migrate, true, "{}", err);

            // Delay 1s before sending events to the window
            sleep(Duration::from_secs(1)).await;
            if let Some(window) = handle::Handle::global().get_main_window() {
                let _ = window.emit("nvm-desktop://app-migration-error", ());
            }
        }
    });
}

async fn sync_runtime() -> Result<()> {
    let resources = dirs::app_resources_dir()?;
    let bin = dirs::bin_path()?;
    let state_path = dirs::runtime_state_path()?;
    sync_runtime_at(&resources, &bin, &state_path).await
}

async fn sync_runtime_at(resources: &Path, bin: &Path, state_path: &Path) -> Result<()> {
    let manifest: RuntimeManifest =
        serde_json::from_slice(&fs::read(resources.join("runtime-manifest.json")).await?)?;
    ensure!(
        manifest.format_version == 1,
        "Unsupported runtime manifest format"
    );
    ensure!(!manifest.bundle_id.is_empty(), "Missing runtime bundle ID");

    let state = read_state(state_path).await?;
    if state.as_ref() == Some(&manifest) && runtime_files_exist(bin).await? {
        return Ok(());
    }

    fs::create_dir_all(bin).await?;
    // Invalidate before touching files: a failed update must also retry after an app downgrade.
    match fs::remove_file(state_path).await {
        Ok(()) => {}
        Err(err) if err.kind() == ErrorKind::NotFound => {}
        Err(err) => return Err(err.into()),
    }
    install_runtime(resources, bin).await?;

    #[cfg(target_os = "macos")]
    self_heal(&bin.join("nvmd")).await?;

    // Only record success after every executable, wrapper and platform fix has completed.
    let temporary_state = state_path.with_extension("json.tmp");
    fs::write(&temporary_state, serde_json::to_vec_pretty(&manifest)?).await?;
    fs::rename(temporary_state, state_path).await?;
    Ok(())
}

async fn read_state(path: &Path) -> Result<Option<RuntimeManifest>> {
    match fs::read(path).await {
        Ok(content) => match serde_json::from_slice(&content) {
            Ok(state) => Ok(Some(state)),
            Err(err) => {
                logging_error!(Type::Migrate, false, "Invalid runtime state: {}", err);
                Ok(None)
            }
        },
        Err(err) if err.kind() == ErrorKind::NotFound => Ok(None),
        Err(err) => Err(err).context("Failed to read runtime state"),
    }
}

async fn runtime_files_exist(bin: &Path) -> Result<bool> {
    #[cfg(windows)]
    {
        if !is_runtime_file(&bin.join("nvmd.exe")).await? {
            return Ok(false);
        }
        for name in NODE_DEFAULT_EXECUTE {
            if !is_runtime_file(&bin.join(format!("{name}.exe"))).await?
                || (name != "node" && !is_runtime_file(&bin.join(format!("{name}.cmd"))).await?)
            {
                return Ok(false);
            }
        }
    }
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let executable = bin.join("nvmd");
        let metadata = match fs::metadata(&executable).await {
            Ok(metadata) => metadata,
            Err(err) if err.kind() == ErrorKind::NotFound => return Ok(false),
            Err(err) => return Err(err.into()),
        };
        if !metadata.is_file() || metadata.permissions().mode() & 0o111 == 0 {
            return Ok(false);
        }
        for name in NODE_DEFAULT_EXECUTE {
            match fs::read_link(bin.join(name)).await {
                Ok(target) if target == Path::new("nvmd") || target == executable => {}
                Ok(_) => return Ok(false),
                Err(err) if matches!(err.kind(), ErrorKind::NotFound | ErrorKind::InvalidInput) => {
                    return Ok(false);
                }
                Err(err) => return Err(err.into()),
            }
        }
    }
    Ok(true)
}

#[cfg(windows)]
async fn is_runtime_file(path: &Path) -> Result<bool> {
    match fs::metadata(path).await {
        Ok(metadata) => Ok(metadata.is_file()),
        Err(err) if err.kind() == ErrorKind::NotFound => Ok(false),
        Err(err) => Err(err.into()),
    }
}

async fn replace_file(source: &Path, destination: &Path) -> Result<()> {
    // Prepare a complete sibling file before replacing the live executable.
    let temporary = destination.with_extension("runtime-tmp");
    fs::copy(source, &temporary).await?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(&temporary, std::fs::Permissions::from_mode(0o755)).await?;
    }
    fs::rename(&temporary, destination)
        .await
        .with_context(|| format!("Failed to replace {}", destination.display()))?;
    Ok(())
}

#[cfg(windows)]
async fn install_runtime(resources: &Path, bin: &Path) -> Result<()> {
    use std::collections::BTreeSet;

    let mut names: BTreeSet<_> = NODE_DEFAULT_EXECUTE
        .into_iter()
        .map(|name| format!("{name}.exe"))
        .collect();
    names.insert("nvmd.exe".into());
    // nvmd-command also copies itself for globally installed npm tools (e.g. yarn).
    // Preserve the legacy upgrade behavior for every existing executable proxy.
    let mut entries = fs::read_dir(bin).await?;
    while let Some(entry) = entries.next_entry().await? {
        let path = entry.path();
        if path
            .extension()
            .is_some_and(|ext| ext.eq_ignore_ascii_case("exe"))
            && entry.file_type().await?.is_file()
        {
            names.insert(entry.file_name().to_string_lossy().into_owned());
        }
    }
    let executable = resources.join("nvmd.exe");
    for name in names {
        let destination = bin.join(&name);
        replace_file(&executable, &destination).await?;
        if !name.eq_ignore_ascii_case("node.exe") && !name.eq_ignore_ascii_case("nvmd.exe") {
            replace_file(
                &resources.join("temp.cmd"),
                &destination.with_extension("cmd"),
            )
            .await?;
        }
    }
    Ok(())
}

#[cfg(unix)]
async fn install_runtime(resources: &Path, bin: &Path) -> Result<()> {
    replace_file(&resources.join("nvmd"), &bin.join("nvmd")).await?;
    for name in NODE_DEFAULT_EXECUTE {
        let destination = bin.join(name);
        match fs::symlink_metadata(&destination).await {
            Ok(_) => fs::remove_file(&destination).await?,
            Err(err) if err.kind() == ErrorKind::NotFound => {}
            Err(err) => return Err(err.into()),
        }
        fs::symlink("nvmd", &destination).await?;
    }
    Ok(())
}

#[cfg(target_os = "macos")]
async fn self_heal(executable: &Path) -> Result<()> {
    use tokio::process::Command;

    let attributes = Command::new("xattr").arg(executable).output().await?;
    ensure!(
        attributes.status.success(),
        "Failed to inspect nvmd extended attributes"
    );
    if String::from_utf8_lossy(&attributes.stdout)
        .lines()
        .any(|attribute| attribute == "com.apple.quarantine")
    {
        let output = Command::new("xattr")
            .args(["-d", "com.apple.quarantine"])
            .arg(executable)
            .output()
            .await?;
        ensure!(
            output.status.success(),
            "Failed to remove nvmd quarantine: {}",
            String::from_utf8_lossy(&output.stderr)
        );
    }

    let output = Command::new("codesign")
        .args(["--force", "--deep", "--sign", "-"])
        .arg(executable)
        .output()
        .await?;
    ensure!(
        output.status.success(),
        "Failed to sign nvmd: {}",
        String::from_utf8_lossy(&output.stderr)
    );
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;
    use std::sync::atomic::{AtomicUsize, Ordering};

    struct TestDirectory(PathBuf);

    impl TestDirectory {
        fn new() -> Self {
            static NEXT_ID: AtomicUsize = AtomicUsize::new(0);
            let path = std::env::temp_dir().join(format!(
                "nvmd-runtime-{}-{}-{}",
                std::process::id(),
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_nanos(),
                NEXT_ID.fetch_add(1, Ordering::Relaxed)
            ));
            std::fs::create_dir_all(&path).unwrap();
            Self(path)
        }
    }

    impl Drop for TestDirectory {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.0);
        }
    }

    #[tokio::test]
    async fn state_is_saved_only_after_success_and_matching_state_skips_copying() -> Result<()> {
        let directory = TestDirectory::new();
        let resources = directory.0.join("resources");
        let bin = directory.0.join("bin");
        let state = directory.0.join("runtime-state.json");
        fs::create_dir_all(&resources).await?;
        #[cfg(unix)]
        let executable = "nvmd";
        #[cfg(windows)]
        let executable = "nvmd.exe";
        // macOS signing requires an actual Mach-O executable, confined to this fixture directory.
        #[cfg(target_os = "macos")]
        let binary = fs::read("/usr/bin/true").await?;
        #[cfg(not(target_os = "macos"))]
        let binary = b"test runtime".to_vec();
        fs::write(resources.join(executable), &binary).await?;
        #[cfg(windows)]
        fs::write(resources.join("temp.cmd"), "wrapper").await?;
        let mut manifest = RuntimeManifest {
            format_version: 1,
            target: "test-target".into(),
            bundle_id: "first-bundle".into(),
        };
        let manifest_path = resources.join("runtime-manifest.json");
        fs::write(&manifest_path, serde_json::to_vec(&manifest)?).await?;

        sync_runtime_at(&resources, &bin, &state).await?;
        assert_eq!(read_state(&state).await?, Some(manifest));
        // A matching state must not even attempt to read the bundled executable again.
        fs::remove_file(resources.join(executable)).await?;
        sync_runtime_at(&resources, &bin, &state).await?;

        manifest = RuntimeManifest {
            format_version: 1,
            target: "test-target".into(),
            bundle_id: "second-bundle".into(),
        };
        fs::write(&manifest_path, serde_json::to_vec(&manifest)?).await?;
        assert!(sync_runtime_at(&resources, &bin, &state).await.is_err());
        assert!(read_state(&state).await?.is_none());
        fs::write(resources.join(executable), &binary).await?;
        sync_runtime_at(&resources, &bin, &state).await?;
        assert_eq!(read_state(&state).await?, Some(manifest));
        Ok(())
    }

    #[tokio::test]
    async fn legacy_installation_missing_files_and_downgrade_are_supported() -> Result<()> {
        let directory = TestDirectory::new();
        let resources = directory.0.join("resources");
        let bin = directory.0.join("bin");
        let state = directory.0.join("runtime-state.json");
        fs::create_dir_all(&resources).await?;
        fs::create_dir_all(&bin).await?;
        #[cfg(unix)]
        let executable = "nvmd";
        #[cfg(windows)]
        let executable = "nvmd.exe";
        #[cfg(target_os = "macos")]
        let binary = fs::read("/usr/bin/true").await?;
        #[cfg(not(target_os = "macos"))]
        let binary = b"bundled runtime".to_vec();
        fs::write(resources.join(executable), binary).await?;
        #[cfg(windows)]
        fs::write(resources.join("temp.cmd"), "new wrapper").await?;
        let manifest_path = resources.join("runtime-manifest.json");
        let mut manifest = RuntimeManifest {
            format_version: 1,
            target: "test-target".into(),
            bundle_id: "new-bundle".into(),
        };
        fs::write(&manifest_path, serde_json::to_vec(&manifest)?).await?;
        // This matches an existing installation: migration=33, no runtime state, old proxies.
        fs::write(directory.0.join("migration"), "33").await?;
        fs::write(directory.0.join("setting.json"), "settings sentinel").await?;
        fs::write(directory.0.join("packages.json"), "packages sentinel").await?;
        fs::write(bin.join(executable), "legacy binary").await?;
        #[cfg(unix)]
        fs::symlink(bin.join("nvmd"), bin.join("npm")).await?;
        #[cfg(windows)]
        {
            fs::write(bin.join("yarn.exe"), "legacy binary").await?;
            fs::write(bin.join("yarn.cmd"), "legacy wrapper").await?;
        }
        sync_runtime_at(&resources, &bin, &state).await?;
        assert_eq!(read_state(&state).await?, Some(manifest));
        assert!(runtime_files_exist(&bin).await?);
        #[cfg(windows)]
        {
            assert_eq!(fs::read(bin.join("yarn.exe")).await?, b"bundled runtime");
            assert_eq!(fs::read(bin.join("yarn.cmd")).await?, b"new wrapper");
        }

        // Even with matching state, deleted executables and links must be restored.
        fs::remove_file(bin.join(executable)).await?;
        sync_runtime_at(&resources, &bin, &state).await?;
        #[cfg(unix)]
        fs::remove_file(bin.join("npm")).await?;
        #[cfg(windows)]
        fs::remove_file(bin.join("npm.cmd")).await?;
        sync_runtime_at(&resources, &bin, &state).await?;
        assert!(runtime_files_exist(&bin).await?);

        fs::write(&state, "broken state").await?;
        sync_runtime_at(&resources, &bin, &state).await?;
        // IDs are compared for equality, so returning to an older app bundle also synchronizes.
        manifest = RuntimeManifest {
            format_version: 1,
            target: "test-target".into(),
            bundle_id: "older-bundle".into(),
        };
        fs::write(&manifest_path, serde_json::to_vec(&manifest)?).await?;
        sync_runtime_at(&resources, &bin, &state).await?;
        assert_eq!(read_state(&state).await?, Some(manifest));
        assert_eq!(fs::read(directory.0.join("migration")).await?, b"33");
        assert_eq!(
            fs::read(directory.0.join("setting.json")).await?,
            b"settings sentinel"
        );
        assert_eq!(
            fs::read(directory.0.join("packages.json")).await?,
            b"packages sentinel"
        );
        Ok(())
    }

    #[cfg(windows)]
    #[tokio::test]
    async fn locked_executable_does_not_record_success_and_retries_after_unlock() -> Result<()> {
        use std::os::windows::fs::OpenOptionsExt;

        let directory = TestDirectory::new();
        let resources = directory.0.join("resources");
        let bin = directory.0.join("bin");
        let state = directory.0.join("runtime-state.json");
        fs::create_dir_all(&resources).await?;
        fs::create_dir_all(&bin).await?;
        fs::write(resources.join("nvmd.exe"), "new binary").await?;
        fs::write(resources.join("temp.cmd"), "new wrapper").await?;
        fs::write(bin.join("node.exe"), "old binary").await?;
        let manifest = RuntimeManifest {
            format_version: 1,
            target: "test-target".into(),
            bundle_id: "new-bundle".into(),
        };
        fs::write(
            resources.join("runtime-manifest.json"),
            serde_json::to_vec(&manifest)?,
        )
        .await?;
        let locked = std::fs::OpenOptions::new()
            .read(true)
            .share_mode(0)
            .open(bin.join("node.exe"))?;
        assert!(sync_runtime_at(&resources, &bin, &state).await.is_err());
        assert!(read_state(&state).await?.is_none());
        drop(locked);
        assert_eq!(fs::read(bin.join("node.exe")).await?, b"old binary");
        sync_runtime_at(&resources, &bin, &state).await?;
        assert_eq!(read_state(&state).await?, Some(manifest));
        assert_eq!(fs::read(bin.join("node.exe")).await?, b"new binary");
        Ok(())
    }

    #[tokio::test]
    #[ignore = "requires native CLI resources prepared with pnpm check"]
    async fn bundled_cli_upgrades_legacy_installation_and_executes() -> Result<()> {
        let directory = TestDirectory::new();
        let bin = directory.0.join("bin");
        let state = directory.0.join("runtime-state.json");
        let resources = std::env::var_os("NVMD_TEST_RESOURCE_DIR")
            .map(PathBuf::from)
            .unwrap_or_else(|| Path::new(env!("CARGO_MANIFEST_DIR")).join("resources"));
        fs::create_dir_all(&bin).await?;
        #[cfg(unix)]
        let executable = "nvmd";
        #[cfg(windows)]
        let executable = "nvmd.exe";
        fs::write(bin.join(executable), "legacy runtime").await?;
        fs::write(directory.0.join("migration"), "33").await?;
        sync_runtime_at(&resources, &bin, &state).await?;
        assert!(read_state(&state).await?.is_some());
        let output = tokio::time::timeout(
            Duration::from_secs(10),
            tokio::process::Command::new(bin.join(executable))
                .arg("--version")
                .env("NVMD_HOME", &directory.0)
                .current_dir(&directory.0)
                .output(),
        )
        .await??;
        ensure!(
            output.status.success(),
            "Installed CLI failed: {}",
            String::from_utf8_lossy(&output.stderr)
        );
        ensure!(
            !output.stdout.is_empty(),
            "Installed CLI returned no version"
        );
        // Keep an existing Node installation/default intact and exercise the upgraded proxy.
        let node = tokio::process::Command::new("node")
            .args([
                "-p",
                "JSON.stringify({path: process.execPath, version: process.version})",
            ])
            .output()
            .await?;
        ensure!(node.status.success(), "Node fixture is unavailable");
        let node: serde_json::Value = serde_json::from_slice(&node.stdout)?;
        let node_path = Path::new(node["path"].as_str().context("Missing Node fixture path")?);
        let version = node["version"]
            .as_str()
            .context("Missing Node fixture version")?;
        let versions = directory.0.join("versions");
        let installation = versions.join(version.trim_start_matches('v'));
        #[cfg(unix)]
        let node_bin = installation.join("bin");
        #[cfg(windows)]
        let node_bin = installation;
        fs::create_dir_all(&node_bin).await?;
        #[cfg(unix)]
        fs::symlink(node_path, node_bin.join("node")).await?;
        #[cfg(windows)]
        fs::copy(node_path, node_bin.join("node.exe")).await?;
        fs::write(directory.0.join("default"), version.trim_start_matches('v')).await?;
        fs::write(
            directory.0.join("setting.json"),
            serde_json::to_vec(&serde_json::json!({
                "directory": versions,
                "node_version_file": ".nvmd-runtime-test-version"
            }))?,
        )
        .await?;
        #[cfg(unix)]
        let proxy = "node";
        #[cfg(windows)]
        let proxy = "node.exe";
        let output = tokio::time::timeout(
            Duration::from_secs(10),
            tokio::process::Command::new(bin.join(proxy))
                .arg("--version")
                .env("NVMD_HOME", &directory.0)
                .env_remove("NVMD_NODE_VERSION")
                .current_dir(&directory.0)
                .output(),
        )
        .await??;
        ensure!(
            output.status.success(),
            "Upgraded Node proxy failed: {}",
            String::from_utf8_lossy(&output.stderr)
        );
        assert_eq!(String::from_utf8_lossy(&output.stdout).trim(), version);
        // Simulate the next app launch; the already installed runtime remains usable.
        sync_runtime_at(&resources, &bin, &state).await?;
        Ok(())
    }

    #[tokio::test]
    async fn installation_repairs_missing_entries_and_can_be_repeated() -> Result<()> {
        let directory = TestDirectory::new();
        let resources = directory.0.join("resources");
        let bin = directory.0.join("bin");
        fs::create_dir_all(&resources).await?;
        fs::create_dir_all(&bin).await?;
        #[cfg(unix)]
        let executable = "nvmd";
        #[cfg(windows)]
        let executable = "nvmd.exe";
        fs::write(resources.join(executable), "first binary").await?;
        #[cfg(windows)]
        fs::write(resources.join("temp.cmd"), "first wrapper").await?;

        assert!(!runtime_files_exist(&bin).await?);
        install_runtime(&resources, &bin).await?;
        assert!(runtime_files_exist(&bin).await?);
        install_runtime(&resources, &bin).await?;
        assert!(runtime_files_exist(&bin).await?);

        #[cfg(unix)]
        let entry = "npm";
        #[cfg(windows)]
        let entry = "npm.cmd";
        fs::remove_file(bin.join(entry)).await?;
        assert!(!runtime_files_exist(&bin).await?);
        fs::write(resources.join(executable), "second binary").await?;
        #[cfg(windows)]
        fs::write(resources.join("temp.cmd"), "second wrapper").await?;
        install_runtime(&resources, &bin).await?;
        assert!(runtime_files_exist(&bin).await?);
        assert_eq!(fs::read(bin.join(executable)).await?, b"second binary");
        #[cfg(windows)]
        assert_eq!(fs::read(bin.join(entry)).await?, b"second wrapper");
        Ok(())
    }

    #[tokio::test]
    async fn missing_source_does_not_truncate_existing_executable() -> Result<()> {
        let directory = TestDirectory::new();
        let destination = directory.0.join("nvmd");
        fs::write(&destination, "working binary").await?;
        assert!(
            replace_file(&directory.0.join("missing"), &destination)
                .await
                .is_err()
        );
        assert_eq!(fs::read(destination).await?, b"working binary");
        Ok(())
    }

    #[tokio::test]
    async fn absent_or_corrupt_state_requires_reinstallation() -> Result<()> {
        let directory = TestDirectory::new();
        let state = directory.0.join("runtime-state.json");
        assert!(read_state(&state).await?.is_none());
        fs::write(&state, "{interrupted write").await?;
        assert!(read_state(&state).await?.is_none());
        // I/O errors must not be mistaken for a missing installation.
        assert!(read_state(&directory.0).await.is_err());
        Ok(())
    }
}

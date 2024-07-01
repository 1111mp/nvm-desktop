mod tarball;
mod zip;

use super::node;
use anyhow::Result;
use std::path::PathBuf;

/// get progress
/// source: &str (`download` & `unzip`)
/// completed size
/// total size
pub type OnProgress = dyn Fn(&str, usize, usize) + Send + Sync;

cfg_if::cfg_if! {
    if #[cfg(unix)] {
        /// Fetch a remote archive in the native OS-preferred format from the specified
        /// URL and store its results at the specified file path.
        ///
        /// On Windows, the preferred format is zip. On Unixes, the preferred format
        /// is tarball.
        pub async fn fetch_native(mirror: &String, version: &String, dest: &String, on_progress: &OnProgress) -> Result<()> {
          	tarball::fetch(mirror, version, dest, on_progress).await
        }
    } else if #[cfg(windows)] {
        /// Fetch a remote archive in the native OS-preferred format from the specified
        /// URL and store its results at the specified file path.
        ///
        /// On Windows, the preferred format is zip. On Unixes, the preferred format
        /// is tarball.
        pub async fn fetch_native(mirror: &String, version: &String, dest: &String, on_progress: &OnProgress) -> Result<()> {
            zip::fetch(mirror, version, dest, on_progress).await
        }
    } else {
        compile_error!("Unsupported OS (expected 'unix' or 'windows').");
    }
}

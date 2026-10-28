use cfg_if::cfg_if;
use node_semver::Version;

cfg_if! {
  if #[cfg(all(target_os = "windows", target_arch = "x86"))] {
      /// The OS component of a Node distro filename
      pub const NODE_DISTRO_OS: &str = "win";
      /// The architecture component of a Node distro filename
      pub const NODE_DISTRO_ARCH: &str = "x86";
      /// The extension for Node distro files
      pub const NODE_DISTRO_EXTENSION: &str = "zip";
      /// The file identifier in the Node index `files` array
      pub const NODE_DISTRO_IDENTIFIER: &str = "win-x86-zip";
  } else if #[cfg(all(target_os = "windows", target_arch = "x86_64"))] {
      /// The OS component of a Node distro filename
      pub const NODE_DISTRO_OS: &str = "win";
      /// The architecture component of a Node distro filename
      pub const NODE_DISTRO_ARCH: &str = "x64";
      /// The extension for Node distro files
      pub const NODE_DISTRO_EXTENSION: &str = "zip";
      /// The file identifier in the Node index `files` array
      pub const NODE_DISTRO_IDENTIFIER: &str = "win-x64-zip";
  } else if #[cfg(all(target_os = "windows", target_arch = "aarch64"))] {
      /// The OS component of a Node distro filename
      pub const NODE_DISTRO_OS: &str = "win";
      /// The architecture component of a Node distro filename
      pub const NODE_DISTRO_ARCH: &str = "arm64";
      /// The extension for Node distro files
      pub const NODE_DISTRO_EXTENSION: &str = "zip";
      /// The file identifier in the Node index `files` array
      pub const NODE_DISTRO_IDENTIFIER: &str = "win-arm64-zip";

      // NOTE: Node support for pre-built ARM64 binaries on Windows was added in major version 20
      // For versions prior to that, we need to fall back on the x64 binaries via emulator

      /// The fallback architecture component of a Node distro filename
      pub const NODE_DISTRO_ARCH_FALLBACK: &str = "x64";
      /// The fallback file identifier in the Node index `files` array
      pub const NODE_DISTRO_IDENTIFIER_FALLBACK: &str = "win-x64-zip";
  } else if #[cfg(all(target_os = "macos", target_arch = "x86_64"))] {
      /// The OS component of a Node distro filename
      pub const NODE_DISTRO_OS: &str = "darwin";
      /// The architecture component of a Node distro filename
      pub const NODE_DISTRO_ARCH: &str = "x64";
      /// The extension for Node distro files
      pub const NODE_DISTRO_EXTENSION: &str = "tar.gz";
      /// The file identifier in the Node index `files` array
      pub const NODE_DISTRO_IDENTIFIER: &str = "osx-x64-tar";
  } else if #[cfg(all(target_os = "macos", target_arch = "aarch64"))] {
      /// The OS component of a Node distro filename
      pub const NODE_DISTRO_OS: &str = "darwin";
      /// The architecture component of a Node distro filename
      pub const NODE_DISTRO_ARCH: &str = "arm64";
      /// The extension for Node distro files
      pub const NODE_DISTRO_EXTENSION: &str = "tar.gz";
      /// The file identifier in the Node index `files` array
      pub const NODE_DISTRO_IDENTIFIER: &str = "osx-arm64-tar";

      // NOTE: Node support for pre-built Apple Silicon binaries was added in major version 16
      // For versions prior to that, we need to fall back on the x64 binaries via Rosetta 2

      /// The fallback architecture component of a Node distro filename
      pub const NODE_DISTRO_ARCH_FALLBACK: &str = "x64";
      /// The fallback file identifier in the Node index `files` array
      pub const NODE_DISTRO_IDENTIFIER_FALLBACK: &str = "osx-x64-tar";
  } else if #[cfg(all(target_os = "linux", target_arch = "x86_64"))] {
      /// The OS component of a Node distro filename
      pub const NODE_DISTRO_OS: &str = "linux";
      /// The architecture component of a Node distro filename
      pub const NODE_DISTRO_ARCH: &str = "x64";
      /// The extension for Node distro files
      pub const NODE_DISTRO_EXTENSION: &str = "tar.gz";
      /// The file identifier in the Node index `files` array
      pub const NODE_DISTRO_IDENTIFIER: &str = "linux-x64";
  } else if #[cfg(all(target_os = "linux", target_arch = "aarch64"))] {
      /// The OS component of a Node distro filename
      pub const NODE_DISTRO_OS: &str = "linux";
      /// The architecture component of a Node distro filename
      pub const NODE_DISTRO_ARCH: &str = "arm64";
      /// The extension for Node distro files
      pub const NODE_DISTRO_EXTENSION: &str = "tar.gz";
      /// The file identifier in the Node index `files` array
      pub const NODE_DISTRO_IDENTIFIER: &str = "linux-arm64";
  } else if #[cfg(all(target_os = "linux", target_arch = "arm"))] {
      /// The OS component of a Node distro filename
      pub const NODE_DISTRO_OS: &str = "linux";
      /// The architecture component of a Node distro filename
      pub const NODE_DISTRO_ARCH: &str = "armv7l";
      /// The extension for Node distro files
      pub const NODE_DISTRO_EXTENSION: &str = "tar.gz";
      /// The file identifier in the Node index `files` array
      pub const NODE_DISTRO_IDENTIFIER: &str = "linux-armv7l";
  } else {
      compile_error!("Unsuppored operating system + architecture combination");
  }
}

/// The Tool implementation for fetching and installing Node
pub struct Node {
    pub(super) version: Version,
}

impl Node {
    pub fn new(version: Version) -> Self {
        Node { version }
    }

    #[cfg(not(any(
        all(target_os = "macos", target_arch = "aarch64"),
        all(target_os = "windows", target_arch = "aarch64")
    )))]
    pub fn archive_basename(version: &Version, arch: Option<String>) -> String {
        let arch = match arch {
            Some(arch) => arch,
            None => NODE_DISTRO_ARCH.to_string(),
        };
        format!("node-v{}-{}-{}", version, NODE_DISTRO_OS, arch)
    }

    #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
    pub fn archive_basename(version: &Version, arch: Option<String>) -> String {
        // Note: Node began shipping pre-built binaries for Apple Silicon with Major version 16
        // Prior to that, we need to fall back on the x64 binaries
        let arch = match arch {
            Some(arch) => arch,
            None => {
                if version.major >= 16 {
                    NODE_DISTRO_ARCH
                } else {
                    NODE_DISTRO_ARCH_FALLBACK
                }
            }
            .to_string(),
        };
        format!("node-v{}-{}-{}", version, NODE_DISTRO_OS, arch)
    }

    #[cfg(all(target_os = "windows", target_arch = "aarch64"))]
    pub fn archive_basename(version: &Version, arch: Option<String>) -> String {
        // Note: Node began shipping pre-built binaries for Windows ARM with Major version 20
        // Prior to that, we need to fall back on the x64 binaries
        let arch = match arch {
            Some(arch) => arch,
            None => {
                if version.major >= 20 {
                    NODE_DISTRO_ARCH
                } else {
                    NODE_DISTRO_ARCH_FALLBACK
                }
            }
            .to_string(),
        };
        format!("node-v{}-{}-{}", version, NODE_DISTRO_OS, arch)
    }

    pub fn archive_filename(version: &Version, arch: Option<String>) -> (String, String) {
        let name = Node::archive_basename(version, arch);
        let full_name = format!("{}.{}", name, NODE_DISTRO_EXTENSION);
        (name, full_name)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_node_archive_basename() {
        assert_eq!(
            Node::archive_basename(&Version::parse("20.2.3").unwrap(), None),
            format!("node-v20.2.3-{}-{}", NODE_DISTRO_OS, NODE_DISTRO_ARCH)
        );
    }

    #[test]
    fn test_node_archive_filename() {
        let (_, full_name) = Node::archive_filename(&Version::parse("20.2.3").unwrap(), None);
        assert_eq!(
            full_name,
            format!(
                "node-v20.2.3-{}-{}.{}",
                NODE_DISTRO_OS, NODE_DISTRO_ARCH, NODE_DISTRO_EXTENSION
            )
        );
    }

    #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
    const ARM64_SUPPORT_MAJOR: u64 = 16;
    #[cfg(all(target_os = "windows", target_arch = "aarch64"))]
    const ARM64_SUPPORT_MAJOR: u64 = 20;

    #[test]
    #[cfg(all(
        target_arch = "aarch64",
        any(target_os = "macos", target_os = "windows")
    ))]
    fn test_fallback_node_archive_basename() {
        // Keep version input and expectations aligned on both sides of the
        // native ARM64 support boundary; fallback changes only the architecture.
        for (version, arch) in [
            (
                format!("{}.2.3", ARM64_SUPPORT_MAJOR - 1),
                NODE_DISTRO_ARCH_FALLBACK,
            ),
            (format!("{}.0.0", ARM64_SUPPORT_MAJOR), NODE_DISTRO_ARCH),
        ] {
            assert_eq!(
                Node::archive_basename(&Version::parse(&version).unwrap(), None),
                format!("node-v{version}-{NODE_DISTRO_OS}-{arch}")
            );
        }
    }

    #[test]
    #[cfg(all(
        target_arch = "aarch64",
        any(target_os = "macos", target_os = "windows")
    ))]
    fn test_fallback_node_archive_filename() {
        for (version, arch) in [
            (
                format!("{}.2.3", ARM64_SUPPORT_MAJOR - 1),
                NODE_DISTRO_ARCH_FALLBACK,
            ),
            (format!("{}.0.0", ARM64_SUPPORT_MAJOR), NODE_DISTRO_ARCH),
        ] {
            let expected_name = format!("node-v{version}-{NODE_DISTRO_OS}-{arch}");
            assert_eq!(
                Node::archive_filename(&Version::parse(&version).unwrap(), None),
                (
                    expected_name.clone(),
                    format!("{expected_name}.{NODE_DISTRO_EXTENSION}")
                )
            );
        }
    }

    #[test]
    fn test_explicit_architecture_overrides_native_default_and_fallback() {
        for (version, arch) in [("15.2.3", "arm64"), ("20.2.3", "x64")] {
            let expected_name = format!("node-v{version}-{NODE_DISTRO_OS}-{arch}");
            assert_eq!(
                Node::archive_filename(&Version::parse(version).unwrap(), Some(arch.into())),
                (
                    expected_name.clone(),
                    format!("{expected_name}.{NODE_DISTRO_EXTENSION}")
                )
            );
        }
    }
}

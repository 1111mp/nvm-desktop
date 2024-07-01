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
    pub fn archive_basename(version: &Version) -> String {
        format!("node-v{}-{}-{}", version, NODE_DISTRO_OS, NODE_DISTRO_ARCH)
    }

    #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
    pub fn archive_basename(version: &Version) -> String {
        // Note: Node began shipping pre-built binaries for Apple Silicon with Major version 16
        // Prior to that, we need to fall back on the x64 binaries
        format!(
            "node-v{}-{}-{}",
            version,
            NODE_DISTRO_OS,
            if version.major >= 16 {
                NODE_DISTRO_ARCH
            } else {
                NODE_DISTRO_ARCH_FALLBACK
            }
        )
    }

    #[cfg(all(target_os = "windows", target_arch = "aarch64"))]
    pub fn archive_basename(version: &Version) -> String {
        // Note: Node began shipping pre-built binaries for Windows ARM with Major version 20
        // Prior to that, we need to fall back on the x64 binaries
        format!(
            "node-v{}-{}-{}",
            version,
            NODE_DISTRO_OS,
            if version.major >= 20 {
                NODE_DISTRO_ARCH
            } else {
                NODE_DISTRO_ARCH_FALLBACK
            }
        )
    }

    pub fn archive_filename(version: &Version) -> (String, String) {
        let name = Node::archive_basename(version);
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
            Node::archive_basename(&Version::parse("20.2.3").unwrap()),
            format!("node-v20.2.3-{}-{}", NODE_DISTRO_OS, NODE_DISTRO_ARCH)
        );
    }

    #[test]
    fn test_node_archive_filename() {
        assert_eq!(
            Node::archive_filename(&Version::parse("20.2.3").unwrap()),
            format!(
                "node-v20.2.3-{}-{}.{}",
                NODE_DISTRO_OS, NODE_DISTRO_ARCH, NODE_DISTRO_EXTENSION
            )
        );
    }

    #[test]
    #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
    fn test_fallback_node_archive_basename() {
        assert_eq!(
            Node::archive_basename(&Version::parse("15.2.3").unwrap()),
            format!(
                "node-v15.2.3-{}-{}",
                NODE_DISTRO_OS, NODE_DISTRO_ARCH_FALLBACK
            )
        );
    }

    #[test]
    #[cfg(all(target_os = "windows", target_arch = "aarch64"))]
    fn test_fallback_node_archive_basename() {
        assert_eq!(
            Node::archive_basename(&Version::parse("19.2.3").unwrap()),
            format!(
                "node-v19.2.3-{}-{}",
                NODE_DISTRO_OS, NODE_DISTRO_ARCH_FALLBACK
            )
        );
    }

    #[test]
    #[cfg(all(target_os = "macos", target_arch = "aarch64"))]
    fn test_fallback_node_archive_filename() {
        assert_eq!(
            Node::archive_filename(&Version::parse("15.2.3").unwrap()),
            format!(
                "node-v15.2.3-{}-{}.{}",
                NODE_DISTRO_OS, NODE_DISTRO_ARCH_FALLBACK, NODE_DISTRO_EXTENSION
            )
        );
    }

    #[test]
    #[cfg(all(target_os = "windows", target_arch = "aarch64"))]
    fn test_fallback_node_archive_filename() {
        assert_eq!(
            Node::archive_filename(&Version::parse("19.2.3").unwrap()),
            format!(
                "node-v19.2.3-{}-{}.{}",
                NODE_DISTRO_OS, NODE_DISTRO_ARCH_FALLBACK, NODE_DISTRO_EXTENSION
            )
        );
    }
}

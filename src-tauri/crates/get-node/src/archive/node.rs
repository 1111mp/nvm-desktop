use cfg_if::cfg_if;

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

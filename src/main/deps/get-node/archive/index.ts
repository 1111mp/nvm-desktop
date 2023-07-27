import { platform } from 'node:process';

import { downloadGz } from './gz';
import { downloadRaw } from './raw';
import { shouldUseZip, downloadZip } from './zip';

// Retrieve the Node binary from the Node website and persist it.
// The URL depends on the current OS and CPU architecture.
export const downloadRuntime = ({
  version,
  tmpFile,
  arch,
  fetchOpts,
  onProgress,
}) => {
  if (platform === 'win32') {
    return downloadWindowsNode({
      version,
      tmpFile,
      arch,
      fetchOpts,
      onProgress,
    });
  }

  if (SUPPORTED_UNIX.has(platform)) {
    return downloadUnixNode({ version, tmpFile, arch, fetchOpts, onProgress });
  }

  /* c8 ignore start */
  // TODO: support android, freebsd and openbsd.
  // https://nodejs.org/dist does not deliver binaries for those platforms.
  // We currently do not run CI tests on those platforms
  throw new Error(`Unsupported platform: ${platform}`);
  /* c8 ignore stop */
};

const SUPPORTED_UNIX = new Set(['linux', 'darwin', 'aix', 'sunos']);

// The Windows Node binary comes as a regular file or as a .zip file. We try
// to use the fastest method.
export const downloadWindowsNode = async ({
  version,
  tmpFile,
  arch,
  fetchOpts,
}) => {
  // if (await shouldUse7z(version)) {
  //   return download7z({ version, tmpFile, arch, fetchOpts });
  // }

  if (shouldUseZip(version)) {
    return downloadZip({ version, tmpFile, arch, fetchOpts });
  }

  return downloadRaw({ version, tmpFile, arch, fetchOpts });
};

// The Unix Node binary comes in a .tar.gz or .tar.xz archive.
export const downloadUnixNode = async ({
  version,
  tmpFile,
  arch,
  fetchOpts,
  onProgress,
}) => {
  // if (await shouldUseXz(version)) {
  //   return downloadXz({ version, tmpFile, arch, fetchOpts });
  // }

  return downloadGz({ version, tmpFile, arch, fetchOpts, onProgress });
};

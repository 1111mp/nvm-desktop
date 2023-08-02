import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { platform } from 'node:process';

import { pathExists, move } from 'fs-extra';
import { tmpName } from 'tmp-promise';

import { getArch } from './arch';
import { downloadRuntime } from './archive';
import type { Options } from './archive/types';

// Download the Node.js binary for a specific `version`.
// If the file already exists, do nothing. This allows caching.
export const download = async ({
  version,
  output,
  arch,
  fetchOpts,
  onProgress,
}: Omit<Options, 'tmpFile'> & { output: string }) => {
  const archA = getArch(arch);
  const nodePath = join(output, version);

  if (await pathExists(join(nodePath, NODE_FILENAME))) {
    return nodePath;
  }

  await downloadFile({ version, nodePath, arch: archA, fetchOpts, onProgress });

  return nodePath;
};

// On Unix, `node` binaries are usually installed inside a `bin` directory.
// This is for example how `nvm` works. Some tools assume this convention and
// use `process.execPath` accordingly. For example `npm` or `yarn` do this to
// find out the global Node directory (aka `prefix`).
// However, on Windows, the directory is flat and the executable has `*.exe`.
const NODE_FILENAME = platform === 'win32' ? 'node.exe' : 'bin/node';

// Downloading the file should be atomic, so we don't leave partially written
// corrupted file executables. We cannot use libraries like `write-file-atomic`
// because they don't support streams. We download to the temporary directory
// first then move the file once download has completed.
// We use the temporary directory instead of creating a sibling file:
//  - this is to make sure if process is interrupted (e.g. with SIGINT), the
//    temporary file is cleaned up (without requiring libraries like
//    `signal-exit`)
//  - this means the file might be on a different partition
//    (https://github.com/ehmicky/get-node/issues/1), requiring copying it
//    instead of renaming it. This is done by the `move-file` library.
const downloadFile = async ({
  version,
  nodePath,
  arch,
  fetchOpts,
  onProgress,
}: Omit<Options, 'tmpFile'> & { nodePath: string }) => {
  const tmpFile = await tmpName({ prefix: `get-node-${version}-${arch}` });

  try {
    await tmpDownload({ version, tmpFile, arch, fetchOpts, onProgress });
    await moveTmpFile(`${tmpFile}/${version}`, nodePath);
  } finally {
    await cleanTmpFile(tmpFile);
  }
};

const tmpDownload = async ({
  version,
  tmpFile,
  arch,
  fetchOpts,
  onProgress,
}: Options) => {
  const checksumError = await safeDownload({
    version,
    tmpFile,
    arch,
    fetchOpts,
    onProgress,
  });

  // We throw checksum errors only after everything else worked, so that errors
  // due to wrong platform, connectivity or wrong `mirror` option are shown
  // instead of the checksum error.
  if (checksumError !== undefined) {
    throw new Error(await checksumError);
  }
};

const safeDownload = async ({
  version,
  tmpFile,
  arch,
  fetchOpts,
  onProgress,
}: Options) => {
  try {
    return await downloadRuntime({
      version,
      tmpFile,
      arch,
      fetchOpts,
      onProgress,
    });
  } catch (error) {
    throw new Error(
      getDownloadError({ message: error.message, version, arch, fetchOpts }),
    );
  }
};

const getDownloadError = ({
  message,
  version,
  arch,
  fetchOpts,
}: Omit<Options, 'tmpFile' | 'onProgress'> & { message: string }) => {
  if (message.includes('getaddrinfo')) {
    return `Could not connect to ${fetchOpts.mirror}`;
  }

  if (message.includes('404')) {
    return `No Node.js binaries available for ${version} on ${platform} ${arch}`;
  }

  // Testing other HTTP errors is hard in CI.
  /* c8 ignore next */
  return `Could not download Node.js ${version}: ${message}`;
};

const moveTmpFile = async (tmpFile: string, nodePath: string) => {
  // Another parallel download might have been running
  // if (await pathExists(nodePath)) {
  //   return;
  // }

  await move(tmpFile, nodePath);
};

// The temporary file might still exist if:
//  - another parallel download was running
//  - an error was thrown
const cleanTmpFile = async (tmpFile: string) => {
  await rm(tmpFile, { force: true, recursive: true });
};

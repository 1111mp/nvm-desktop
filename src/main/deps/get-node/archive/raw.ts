import { pipeline } from 'node:stream/promises';
import semver from 'semver';
import { ensureFile } from 'fs-extra';
import { throttle } from 'lodash';
import { fetchNodeUrl, promiseOrFetchError, writeNodeBinary } from '../fetch';

import type { Arch, Options } from './types';

// On Windows, when no zip archive is available (old Node.js versions), download
// the raw `node.exe` file available for download instead.
export const downloadRaw = async ({
  version,
  tmpFile,
  arch,
  fetchOpts,
  onProgress,
}: Options) => {
  const filepath = getFilepath(version, arch);
  const { response, checksumError } = await fetchNodeUrl(
    version,
    filepath,
    fetchOpts,
  );

  if (onProgress) {
    const throttled = throttle(onProgress, 300);
    response.on('downloadProgress', throttled);
  }

  await ensureFile(`${tmpFile}/${version}/node.exe`);

  const promise = pipeline(
    response,
    writeNodeBinary(`${tmpFile}/${version}/node.exe`),
  );

  await promiseOrFetchError(promise, response);

  // await rename(`${tmpFile}`, `${tmpFile}/${version}`);

  return checksumError;
};

// Before Node.js 4.0.0, the URL to the node.exe was different
const getFilepath = (version: string, arch: Arch) => {
  if (semver.gte(version, NEW_URL_VERSION)) {
    return `win-${arch}/node.exe`;
  }

  /* c8 ignore start */
  // We currently only run CI tests on Windows x64
  if (arch === 'x64') {
    return 'x64/node.exe';
  }

  return 'node.exe';
  /* c8 ignore stop */
};

const NEW_URL_VERSION = '4.0.0';

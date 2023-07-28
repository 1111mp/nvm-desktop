import { buffer } from 'node:stream/consumers';

import compressing from 'compressing';
import semver from 'semver';
import { rename } from 'fs-extra';
import { throttle } from 'lodash';
import { fetchNodeUrl, promiseOrFetchError } from '../fetch';

import type { Options } from './types';

// .zip Node binaries for Windows were added in Node 4.5.0 and 6.2.1
export const shouldUseZip = (version: string) =>
  semver.satisfies(version, ZIP_VERSION_RANGE);

const ZIP_VERSION_RANGE = '^4.5.0 || >=6.2.1';

// Download the Node binary .zip archive and return it as a stream
// However we can stream the file unzipping with the file writing.
export const downloadZip = async ({
  version,
  tmpFile,
  arch,
  fetchOpts,
  onProgress,
}: Options) => {
  const filepath = getZipFilepath(version, arch);
  const { response, checksumError } = await fetchNodeUrl(
    version,
    `${filepath}.zip`,
    fetchOpts,
  );

  if (onProgress) {
    const throttled = throttle(onProgress, 300);
    response.on('downloadProgress', throttled);
  }

  const zipContent = await buffer(response);
  const promise = getZipStream(zipContent, tmpFile);

  await promiseOrFetchError(promise, response);

  await rename(`${tmpFile}/${filepath}`, `${tmpFile}/${version}`);

  return checksumError;
};

const getZipFilepath = (version: string, arch: string) =>
  `node-v${version}-win-${arch}`;

const getZipStream = async (zipContent: Buffer, tmpFile: string) => {
  return compressing.zip.uncompress(zipContent, `${tmpFile}`);
};

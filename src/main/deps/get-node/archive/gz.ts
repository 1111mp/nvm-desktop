import { platform } from 'node:process';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import { rename } from 'fs-extra';
import { throttle } from 'lodash';

import { fetchNodeUrl, promiseOrFetchError } from '../fetch';

import { untar } from './tar';
import type { Options } from './types';

// Downloads .tar.gz archive and extract it
export const downloadGz = async ({
  version,
  arch,
  tmpFile,
  fetchOpts,
  onProgress,
}: Options) => {
  const name = `node-v${version}-${platform}-${arch}`;
  const { response, checksumError } = await fetchNodeUrl(
    version,
    `${name}.tar.gz`,
    fetchOpts,
  );

  const promise = pipeline(response, createGunzip(), untar(tmpFile));

  if (onProgress) {
    const throttled = throttle(onProgress, 300);
    response.on('downloadProgress', throttled);
  }

  await promiseOrFetchError(promise, response);

  await rename(`${tmpFile}/${name}`, `${tmpFile}/${version}`);

  return checksumError;
};

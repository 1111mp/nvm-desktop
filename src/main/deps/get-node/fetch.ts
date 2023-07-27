import { once } from 'node:events';
import { createWriteStream } from 'node:fs';

import fetchNodeWebsite from '../fetch-node-website';

import { checkChecksum } from './checksum';

// Make HTTP request to retrieve a Node.js binary.
// Also make another HTTP request to calculate the checksum.
export const fetchNodeUrl = async (version, filepath, fetchOpts) => {
  const response = await fetchNodeWebsite(`v${version}/${filepath}`, fetchOpts);
  const checksumError = checkChecksum({
    version,
    filepath,
    response,
    fetchOpts,
  });
  return { response, checksumError };
};

// `response` `error` events do not necessarily make piped streams error, so we
// need to await either.
export const promiseOrFetchError = async (promise, response) => {
  await Promise.race([promise, throwOnFetchError(response)]);
};

const throwOnFetchError = async (response) => {
  const [error] = await once(response, 'error');
  throw error;
};

// Persist stream to a `node[.exe]` file
export const writeNodeBinary = (tmpFile) =>
  createWriteStream(tmpFile, { mode: NODE_MODE });

const NODE_MODE = 0o755;

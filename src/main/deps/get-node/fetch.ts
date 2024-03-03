import { once } from "node:events";
import { createWriteStream } from "node:fs";

import fetchNodeWebsite from "../fetch-node-website";
import { checkChecksum } from "./checksum";

import type { Request } from "got";
import type { Options as FetchNodeOptions } from "../fetch-node-website";

// Make HTTP request to retrieve a Node.js binary.
// Also make another HTTP request to calculate the checksum.
export const fetchNodeUrl = async (
  version: string,
  filepath: string,
  fetchOpts: FetchNodeOptions
) => {
  const response = await fetchNodeWebsite(`v${version}/${filepath}`, fetchOpts);
  const checksumError = checkChecksum({
    version,
    filepath,
    response,
    fetchOpts
  });
  return { response, checksumError };
};

// `response` `error` events do not necessarily make piped streams error, so we
// need to await either.
export const promiseOrFetchError = async (promise: Promise<void>, response: Request) => {
  await Promise.race([promise, throwOnFetchError(response)]);
};

const throwOnFetchError = async (response: Request) => {
  const [error] = await once(response, "error");
  throw error;
};

// Persist stream to a `node[.exe]` file
export const writeNodeBinary = (tmpFile: string) => createWriteStream(tmpFile, { mode: NODE_MODE });

const NODE_MODE = 0o755;

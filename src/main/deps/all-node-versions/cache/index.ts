import { Stream } from 'node:stream';
import { platform } from 'node:process';
import { pipeline as streamPipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';
import {
  pathExistsSync,
  ensureFileSync,
  readJsonSync,
  readdirSync,
} from 'fs-extra';
import { VERSIONS_FILENAME, INSTALL_DIR } from '../../../constants';

export function setCache({
  response,
  fetch = false,
}: {
  response: Stream;
  fetch?: boolean;
}) {
  if (pathExistsSync(VERSIONS_FILENAME) && !fetch) return;

  response.on('response', async (response) => {
    try {
      ensureFileSync(VERSIONS_FILENAME);
      await streamPipeline(response, createWriteStream(VERSIONS_FILENAME));
    } catch (error) {
      // onError(error);
      console.log(error);
    }
  });
}

export async function getCache({
  fetch = false,
}: {
  fetch?: boolean;
}): Promise<void | Nvmd.Versions> {
  if (fetch || !pathExistsSync(VERSIONS_FILENAME)) return;

  return readJsonSync(VERSIONS_FILENAME);
}

export async function getInstalledVersions(): Promise<string[]> {
  if (!pathExistsSync(INSTALL_DIR)) return [];

  const versions = readdirSync(INSTALL_DIR).filter((version) => {
    const node =
      `${INSTALL_DIR}/${version}/` +
      (platform === 'win32' ? 'node.exe' : 'bin/node');

    return pathExistsSync(node);
  });

  return versions;
}

import { Stream } from 'node:stream';
import { platform } from 'node:process';
import { pipeline as streamPipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';
import { join } from 'node:path';
import { pathExists, ensureFile, readJson, readdir } from 'fs-extra';
import { VERSIONS_FILENAME, INSTALL_DIR } from '../../../constants';

export async function setCache({
  response,
  fetch = false,
}: {
  response: Stream;
  fetch?: boolean;
}) {
  if ((await pathExists(VERSIONS_FILENAME)) && !fetch) return;

  response.on('response', async (response) => {
    try {
      await ensureFile(VERSIONS_FILENAME);
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
  if (fetch || !(await pathExists(VERSIONS_FILENAME))) return;

  const versions = await readJson(VERSIONS_FILENAME);
  return versions;
}

export async function getInstalledVersions(): Promise<string[]> {
  if (!(await pathExists(INSTALL_DIR))) return [];

  const versions = (await readdir(INSTALL_DIR)).filter(async (version) => {
    const node = join(
      INSTALL_DIR,
      version,
      platform === 'win32' ? 'node.exe' : 'bin/node',
    );

    return await pathExists(node);
  });

  return versions;
}

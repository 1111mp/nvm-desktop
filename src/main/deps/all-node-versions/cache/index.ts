import { platform } from 'node:process';
import { join } from 'node:path';
import { pathExists, readJson, readdir, writeJSON } from 'fs-extra';
import { VERSIONS_FILENAME, INSTALL_DIR } from '../../../constants';

export async function setCache(versions: Nvmd.Versions, fetch: boolean = true) {
  if ((await pathExists(VERSIONS_FILENAME)) && !fetch) return;

  await writeJSON(VERSIONS_FILENAME, versions);
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

export async function getInstalledVersions(
  path: string = INSTALL_DIR,
): Promise<string[]> {
  if (!(await pathExists(path))) return [];

  const contents = await readdir(path);
  const exists = await Promise.all(
    contents.map(async (version) => {
      return await pathExists(
        join(path, version, platform === 'win32' ? 'node.exe' : 'bin/node'),
      );
    }),
  );

  const versions = contents.filter((_, index) => exists[index]);

  return versions;
}

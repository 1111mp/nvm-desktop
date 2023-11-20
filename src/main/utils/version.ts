import { join } from 'node:path';
import { pathExists, readFile, remove, writeFile } from 'fs-extra';
import { APPDIR, INSTALL_DIR } from '../constants';

let version: string;

export async function getCurrentVersion(
  fetch: boolean = false,
): Promise<string> {
  if (version !== void 0 && fetch !== true) return version;

  const file = join(APPDIR, 'default');
  if (!(await pathExists(file))) return '';

  version = (await readFile(file)).toString();
  return version;
}

export async function setCurrentVersion(newVersion: string): Promise<void> {
  const file = join(APPDIR, 'default');
  await writeFile(file, newVersion);

  version = newVersion;

  return;
}

export async function uninstallVersion({
  path = INSTALL_DIR,
  version,
  current = false,
}: {
  path?: string;
  version: string;
  current?: boolean;
}) {
  try {
    const versionPath = join(path, version);
    await remove(versionPath);

    current && (await remove(join(APPDIR, 'default')));
    return;
  } catch (err) {
    return Promise.reject(err.message);
  }
}

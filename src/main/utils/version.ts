import { pathExists, readFile, writeFile } from 'fs-extra';
import { APPDIR } from '../constants';

let version: string;

export async function getCurrentVersion(
  fetch: boolean = false,
): Promise<string> {
  if (version !== void 0 && fetch !== true) return version;

  const file = `${APPDIR}/default`;
  if (!(await pathExists(file))) return '';

  version = (await readFile(file)).toString();
  return version;
}

export async function setCurrentVersion(newVersion: string): Promise<void> {
  const file = `${APPDIR}/default`;
  await writeFile(file, newVersion);

  version = newVersion;

  return;
}

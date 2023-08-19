import { exec } from 'node:child_process';
import { platform } from 'node:process';
import { join } from 'node:path';
import { pathExists, copy, readFile, writeFile } from 'fs-extra';
import { app } from 'electron';

import {
  APPDIR,
  INSTALL_DIR,
  NVMD_SHELL_FILENAME,
  SHELL_VERSION_FILE,
} from '../constants';

export async function checkEnv() {
  if (platform === 'win32') {
    try {
      await setNvmdPathForWindows();
    } catch (err) {}
  }

  await setShellFile();
  return;
}

export const SCHEMA_VERSIONS = [updateToSchemaVersion1];

export async function setShellFile() {
  const maxUserVersion = SCHEMA_VERSIONS.length;
  const shellVersion = await getShellVersion();

  for (let index = 0; index < maxUserVersion; index += 1) {
    const runSchemaUpdate = SCHEMA_VERSIONS[index];

    runSchemaUpdate(shellVersion);
  }
  return;
}

async function updateToSchemaVersion1(version: number) {
  if (version >= 1) return;

  const targetFile = `${APPDIR}/${NVMD_SHELL_FILENAME}`;

  const sourceFile = app.isPackaged
    ? join(process.resourcesPath, 'assets', 'nvmd.sh')
    : join(__dirname, '../../..', 'assets', 'nvmd.sh');

  await copy(sourceFile, targetFile).catch((_err) => {});

  setShellVersion(1);
  return;
}

export async function setNvmdPathForWindows() {
  const exist = await pathNvmdExistsForWindows();
  if (exist) return;

  const res = await setNvmdForWindows();
  res && (await setNvmdToPathForWindows());
  return;
}

export async function setNvmdForWindows(): Promise<boolean> {
  return new Promise((resolve) => {
    exec('setx -m NVMD empty', (err, stdout, stderr) => {
      if (err) {
        return resolve(false);
      }

      if (stderr && stderr.trim()) return resolve(false);

      return resolve(true);
    });
  });
}

export async function setNvmdVersionForWindows(
  version: string,
): Promise<boolean> {
  return new Promise((resolve) => {
    exec(`setx -m NVMD ${INSTALL_DIR}\\${version}`, (err, stdout, stderr) => {
      if (err) {
        return resolve(false);
      }

      if (stderr && stderr.trim()) return resolve(false);

      return resolve(true);
    });
  });
}

async function setNvmdToPathForWindows(): Promise<boolean> {
  return new Promise((resolve) => {
    exec('setx -m PATH "%PATH%;%NVMD%"', (err, stdout, stderr) => {
      if (err) {
        return resolve(false);
      }

      if (stderr && stderr.trim()) return resolve(false);

      return resolve(true);
    });
  });
}

async function pathNvmdExistsForWindows(): Promise<boolean> {
  return new Promise((resolve) => {
    exec('echo %NVMD%', (err, stdout, stderr) => {
      if (err) return resolve(false);

      if (stderr) return resolve(false);

      if (stdout && stdout.trim() && stdout.trim() === '%NVMD%')
        return resolve(false);

      return resolve(stdout.trim() ? true : false);
    });
  });
}

async function getShellVersion() {
  if (!(await pathExists(SHELL_VERSION_FILE))) return 0;

  const version = (await readFile(SHELL_VERSION_FILE)).toString() || 0;

  return Number(version);
}

async function setShellVersion(version: number) {
  try {
    await writeFile(SHELL_VERSION_FILE, `${version}`);
  } catch (err) {}
}

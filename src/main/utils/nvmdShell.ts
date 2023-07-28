import { exec } from 'node:child_process';
import { platform } from 'node:process';
import { pathExists, writeFile } from 'fs-extra';
import { APPDIR, INSTALL_DIR, NVMD_SHELL_FILENAME } from '../constants';

export async function checkEnv() {
  if (platform === 'win32') {
    try {
      await setNvmdPathForWindows();
    } catch (err) {}

    return;
  }

  await setShellFile();
  return;
}

export async function setShellFile() {
  const file = `${APPDIR}/${NVMD_SHELL_FILENAME}`;
  if (await pathExists(file)) return;

  const content = `#!/usr/bin/env bash
  
CURRENT_VERSION=$(cat "$HOME/.nvmd/default")
  
export PATH="$HOME/.nvmd/versions/$CURRENT_VERSION/bin:$PATH"

nvmd() {
  echo "1.0.0" >/dev/null
}`;

  await writeFile(file, content);
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

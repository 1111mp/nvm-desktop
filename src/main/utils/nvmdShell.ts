import { exec } from 'node:child_process';
import { platform } from 'node:process';
import { join } from 'node:path';
import {
  pathExists,
  copy,
  readFile,
  readdir,
  writeFile,
  symlink,
  remove,
} from 'fs-extra';
import { app } from 'electron';

import { APPDIR, BIN_DIR, MIRRATION_FILE } from '../constants';

export async function checkEnv() {
  await setShellFile();
  return;
}

export const SCHEMA_VERSIONS = [updateToSchemaVersion1, updateToSchemaVersion2];

export async function setShellFile() {
  const maxUserVersion = SCHEMA_VERSIONS.length;
  const shellVersion = await getShellVersion();

  for (let index = 0; index < maxUserVersion; index += 1) {
    const runSchemaUpdate = SCHEMA_VERSIONS[index];

    await runSchemaUpdate(shellVersion);
  }
  return;
}

async function updateToSchemaVersion1(version: number) {
  if (version >= 1) return;

  if (platform === 'win32') {
    // windows
    await setNvmdToPathForWindows();

    const exeSourceFile = app.isPackaged
      ? join(process.resourcesPath, 'assets', 'sources', 'nvmd.exe')
      : join(__dirname, '../../..', 'assets', 'sources', 'nvmd.exe');
    const cmdSourceFile = app.isPackaged
      ? join(process.resourcesPath, 'assets', 'sources', 'temp.cmd')
      : join(__dirname, '../../..', 'assets', 'sources', 'temp.cmd');

    const promises: Array<Promise<void>> = [];

    promises.push(
      copy(exeSourceFile, join(BIN_DIR, 'nvmd.exe')).catch((_err) => {}),
    );

    ['node', 'npm', 'npx', 'corepack'].forEach((name) => {
      promises.push(
        copy(exeSourceFile, join(BIN_DIR, `${name}.exe`)).catch((_err) => {}),
      );

      if (name !== 'node') {
        promises.push(
          copy(cmdSourceFile, join(BIN_DIR, `${name}.cmd`)).catch((_err) => {}),
        );
      }
    });

    await Promise.all(promises);

    setShellVersion(1);
    return;
  }

  // remove file: .nvmd/shell
  if (await pathExists(`${APPDIR}/shell`)) {
    await remove(`${APPDIR}/shell`);
  }

  // remove file: .nvmd/nvmd.sh
  if (await pathExists(`${APPDIR}/nvmd.sh`)) {
    await remove(`${APPDIR}/nvmd.sh`);
  }

  // macOS
  const targetFile = join(BIN_DIR, 'nvmd');

  const sourceFile = app.isPackaged
    ? join(process.resourcesPath, 'assets', 'sources', 'nvmd')
    : join(__dirname, '../../..', 'assets', 'sources', 'nvmd');

  await copy(sourceFile, targetFile).catch((_err) => {});

  ['node', 'npm', 'npx', 'corepack'].forEach((name) => {
    symlink(targetFile, join(BIN_DIR, name));
  });

  setShellVersion(2);
  return;
}

async function updateToSchemaVersion2(version: number) {
  // version < 1 || version >= 2
  if (version !== 1) return;

  // Macos or Linux
  if (platform !== 'win32') {
    const targetFile = join(BIN_DIR, 'nvmd');

    await remove(targetFile);

    const sourceFile = app.isPackaged
      ? join(process.resourcesPath, 'assets', 'sources', 'nvmd')
      : join(__dirname, '../../..', 'assets', 'sources', 'nvmd');
    await copy(sourceFile, targetFile).catch((_err) => {});

    setShellVersion(2);
    return;
  }

  // Windows
  const targetFile = join(BIN_DIR, 'nvmd.exe');

  await remove(targetFile);

  const sourceFile = app.isPackaged
    ? join(process.resourcesPath, 'assets', 'sources', 'nvmd.exe')
    : join(__dirname, '../../..', 'assets', 'sources', 'nvmd.exe');
  await copy(sourceFile, targetFile).catch((_err) => {});

  async function updateFile(fileName: string) {
    const filePath = join(BIN_DIR, fileName);

    await remove(filePath);

    await copy(sourceFile, filePath).catch((_err) => {});

    return;
  }

  const files = await readdir(BIN_DIR);

  await Promise.all(
    files
      .filter((name) => name.endsWith('.exe'))
      .map((fileName) => updateFile(fileName)),
  );

  setShellVersion(2);
  return;
}

async function setNvmdToPathForWindows(): Promise<boolean> {
  return new Promise((resolve) => {
    exec(`setx -m PATH "${BIN_DIR};%PATH%"`, (err, stdout, stderr) => {
      if (err) {
        return resolve(false);
      }

      if (stderr && stderr.trim()) return resolve(false);

      return resolve(true);
    });
  });
}

async function getShellVersion() {
  if (!(await pathExists(MIRRATION_FILE))) return 0;

  const version = (await readFile(MIRRATION_FILE)).toString() || 0;

  return Number(version);
}

async function setShellVersion(version: number) {
  try {
    await writeFile(MIRRATION_FILE, `${version}`);
  } catch (err) {
    console.log(err);
  }
}

import { exec } from "node:child_process";
import { platform, arch } from "node:process";
import { join } from "node:path";
import {
  pathExists,
  copy,
  copySync,
  readFile,
  readdir,
  writeFile,
  symlink,
  remove
} from "fs-extra";
import { app } from "electron";

import { APPDIR, BIN_DIR, MIRRATION_FILE } from "../constants";

const CURRENT_MIGRATION_VERSION: number = 12;

export async function updateSchema() {
  const schemaVersion = await getSchemaVersion();

  try {
    await updateToSchemaVersionDefault(schemaVersion);
    await updateToSchemaVersionLast(schemaVersion);
  } catch (err) {
    return 408;
  }
  return;
}

async function updateToSchemaVersionDefault(version: number) {
  if (version >= 1) return;

  if (platform === "win32") {
    // windows
    await setNvmdToPathForWindows();

    const exeSourceFile = app.isPackaged
      ? join(process.resourcesPath, "assets", "sources", `${arch}.exe`)
      : join(__dirname, "../../", "assets", "sources", `${arch}.exe`);
    const cmdSourceFile = app.isPackaged
      ? join(process.resourcesPath, "assets", "sources", "temp.cmd")
      : join(__dirname, "../../", "assets", "sources", "temp.cmd");

    await copy(exeSourceFile, join(BIN_DIR, "nvmd.exe"));

    for (const name of ["node", "npm", "npx", "corepack"]) {
      await copy(exeSourceFile, join(BIN_DIR, `${name}.exe`));
      if (name !== "node") {
        await copy(cmdSourceFile, join(BIN_DIR, `${name}.cmd`));
      }
    }

    setSchemaVersion(CURRENT_MIGRATION_VERSION);
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
  const targetFile = join(BIN_DIR, "nvmd");

  const sourceFile = app.isPackaged
    ? join(process.resourcesPath, "assets", "sources", "nvmd")
    : join(__dirname, "../../", "assets", "sources", "nvmd");

  await copy(sourceFile, targetFile).catch((_err) => {});

  await Promise.all(
    ["node", "npm", "npx", "corepack"].map((name) =>
      symlink(targetFile, join(BIN_DIR, name)).catch((_err) => {})
    )
  );

  setSchemaVersion(CURRENT_MIGRATION_VERSION);
  return;
}

async function updateToSchemaVersionLast(version: number) {
  if (version >= CURRENT_MIGRATION_VERSION) return;

  // Macos or Linux
  if (platform !== "win32") {
    const targetFile = join(BIN_DIR, "nvmd");

    const sourceFile = app.isPackaged
      ? join(process.resourcesPath, "assets", "sources", "nvmd")
      : join(__dirname, "../../", "assets", "sources", "nvmd");
    await copy(sourceFile, targetFile).catch((_err) => {});

    setSchemaVersion(CURRENT_MIGRATION_VERSION);
    return;
  }

  // Windows
  const sourceFile = app.isPackaged
    ? join(process.resourcesPath, "assets", "sources", `${arch}.exe`)
    : join(__dirname, "../../", "assets", "sources", `${arch}.exe`);
  await copy(sourceFile, join(BIN_DIR, "nvmd.exe"));

  const files = await readdir(BIN_DIR);
  for (const name of files.filter((name) => name.endsWith(".exe"))) {
    await copy(sourceFile, join(BIN_DIR, name));
  }

  setSchemaVersion(CURRENT_MIGRATION_VERSION);
  return;
}

async function setNvmdToPathForWindows(): Promise<boolean> {
  return new Promise((resolve) => {
    exec(`setx -m PATH "${BIN_DIR};%PATH%"`, (err, _stdout, stderr) => {
      if (err) {
        return resolve(false);
      }

      if (stderr && stderr.trim()) return resolve(false);

      return resolve(true);
    });
  });
}

async function getSchemaVersion() {
  if (!(await pathExists(MIRRATION_FILE))) return 0;

  const version = (await readFile(MIRRATION_FILE)).toString() || 0;

  return Number(version);
}

async function setSchemaVersion(version: number) {
  try {
    await writeFile(MIRRATION_FILE, `${version}`);
  } catch (err) {
    console.log(err);
  }
}

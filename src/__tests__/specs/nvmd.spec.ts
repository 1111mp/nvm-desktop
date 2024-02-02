import { join } from "node:path";
import { platform } from "node:process";
import { pathExists } from "fs-extra";
import { expect } from "@wdio/globals";
import { browser } from "wdio-electron-service";

describe("Module nvmd", async () => {
  it("nvmd file should be existed", async () => {
    const HOMEDIR = await browser.electron.execute((electron) => electron.app.getPath("home"));
    const nvmdPath = join(HOMEDIR, ".nvmd", "bin", platform === "win32" ? "nvmd.exe" : "nvmd");

    expect(await pathExists(nvmdPath)).toBeTruthy();
  });

  it("node file should be existed", async () => {
    const HOMEDIR = await browser.electron.execute((electron) => electron.app.getPath("home"));
    const nodePath = join(HOMEDIR, ".nvmd", "bin", platform === "win32" ? "node.exe" : "node");

    expect(await pathExists(nodePath)).toBeTruthy();
  });

  it("npm file should be existed", async () => {
    const HOMEDIR = await browser.electron.execute((electron) => electron.app.getPath("home"));
    const npmPath = join(HOMEDIR, ".nvmd", "bin", platform === "win32" ? "npm.exe" : "npm");

    expect(await pathExists(npmPath)).toBeTruthy();

    if (platform === "win32") {
      const npmCmdPath = join(HOMEDIR, ".nvmd", "bin", "npm.cmd");
      expect(await pathExists(npmCmdPath)).toBeTruthy();
    }
  });

  it("npx file should be existed", async () => {
    const HOMEDIR = await browser.electron.execute((electron) => electron.app.getPath("home"));
    const npxPath = join(HOMEDIR, ".nvmd", "bin", platform === "win32" ? "npx.exe" : "npx");

    expect(await pathExists(npxPath)).toBeTruthy();

    if (platform === "win32") {
      const npxCmdPath = join(HOMEDIR, ".nvmd", "bin", "npx.cmd");
      expect(await pathExists(npxCmdPath)).toBeTruthy();
    }
  });

  it("corepack file should be existed", async () => {
    const HOMEDIR = await browser.electron.execute((electron) => electron.app.getPath("home"));
    const corepackPath = join(
      HOMEDIR,
      ".nvmd",
      "bin",
      platform === "win32" ? "corepack.exe" : "corepack"
    );
    expect(await pathExists(corepackPath)).toBeTruthy();

    if (platform === "win32") {
      const corepackCmdPath = join(HOMEDIR, ".nvmd", "bin", "corepack.cmd");
      expect(await pathExists(corepackCmdPath)).toBeTruthy();
    }
  });
});

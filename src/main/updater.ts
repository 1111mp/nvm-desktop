import { ipcMain } from "electron";
import updater from "electron-updater";
import log from "electron-log";

const { autoUpdater } = updater;

import type { BrowserWindow } from "electron";

export class AppUpdater {
  constructor(private readonly mainWindow: BrowserWindow) {
    log.transports.file.level = "info";
    autoUpdater.logger = log;
    autoUpdater.autoDownload = false;

    autoUpdater.on("update-available", (info) => {
      // had updates
      this.mainWindow?.webContents.send("update-available", info);
    });

    autoUpdater.on("update-not-available", () => {
      // there are no updates
      this.mainWindow?.webContents.send("update-not-available", "update-not-available");
    });

    autoUpdater.on("download-progress", (progress) => {
      // download progress
      mainWindow?.webContents.send("download-progress", progress);
    });

    autoUpdater.on("update-downloaded", (_evt) => {
      // update downloaded
      ipcMain.once("make-update-now", () => {
        autoUpdater.quitAndInstall();
      });
    });

    autoUpdater.on("error", (error) => {
      // update error
      mainWindow?.webContents.send("update-error", error);
    });

    // initial
    this.checkForUpdates();
    this.comfirmUpdate();
  }

  checkForUpdates() {
    ipcMain.handle("check-for-updates", async () => {
      try {
        const result = await autoUpdater.checkForUpdates();

        return result && result.updateInfo ? result?.updateInfo : result;
      } catch (err) {
        return Promise.reject(err);
      }
    });
  }

  comfirmUpdate() {
    ipcMain.handle("confirm-update", () => {
      return autoUpdater.downloadUpdate();
    });
  }

  clearMainBindings() {
    autoUpdater.removeAllListeners();
  }
}

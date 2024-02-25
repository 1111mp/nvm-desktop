/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import { join } from "node:path";
import { platform } from "node:process";
import { app, BrowserWindow, shell, ipcMain, nativeTheme, dialog, Tray, Menu } from "electron";
import MenuBuilder from "./menu";
import { AppUpdater } from "./updater";
import { resolveHtmlPath } from "./utils/resolvePath";
import { allNodeVersions, allInstalledNodeVersions } from "./deps/all-node-versions";
import getNode from "./deps/get-node";
import { updateSchema } from "./utils/migration";
import { getCurrentVersion, setCurrentVersion, uninstallVersion } from "./utils/version";
import { setSetting, getSetting } from "./utils/setting";
import { getProjects, getVersion, syncProjectVersion, updateProjects } from "./utils/projects";
import { gt } from "semver";
import loadLocale from "./locale";
import { Closer, Themes } from "../types";

import type { MenuItemConstructorOptions, OpenDialogOptions } from "electron";

let mainWindow: BrowserWindow | null = null,
  updater: AppUpdater | null = null,
  tray: Tray | null = null,
  locale: I18n.Locale,
  menuBuilder: MenuBuilder,
  setting: Nvmd.Setting,
  installedVersions: string[];

if (process.env.NODE_ENV === "production") {
  import("source-map-support").then((mapper) => mapper.default.install());
}

const isDebug = process.env.NODE_ENV === "development" || process.env.DEBUG_PROD === "true";

if (isDebug) {
  import("electron-debug").then(({ default: debug }) => debug());
}

const installExtensions = async () => {
  const devtools = require("electron-devtools-installer");
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ["REACT_DEVELOPER_TOOLS"];

  return devtools
    .default(
      extensions.map((name) => devtools[name]),
      forceDownload
    )
    .catch(console.log);
};

nativeTheme.on("updated", () => {
  mainWindow &&
    mainWindow.webContents.send(
      "native-theme:changed",
      nativeTheme.shouldUseDarkColors ? "dark" : "light"
    );
});

const createWindow = async (code?: number) => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? join(process.resourcesPath, "assets")
    : join(__dirname, "../../assets");

  const getAssetPath = (...paths: string[]): string => {
    return join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    frame: false,
    title: "NVM-Desktop",
    width: 1024,
    maxWidth: 1024,
    minWidth: 1024,
    height: 728,
    maxHeight: 728,
    minHeight: 728,
    center: true,
    resizable: false,
    icon: getAssetPath("icon.png"),
    titleBarStyle: process.platform === "darwin" ? "hidden" : "default",
    trafficLightPosition: {
      x: 12,
      y: 12
    },
    backgroundColor:
      setting.theme === Themes.System
        ? nativeTheme.shouldUseDarkColors
          ? "#000000"
          : "#ffffff"
        : setting.theme === Themes.Dark
          ? "#000000"
          : "#ffffff",
    webPreferences: {
      preload: app.isPackaged
        ? join(__dirname, "../preload/preload.js")
        : join(__dirname, "../../out/preload/preload.js")
    }
  });

  mainWindow.loadURL(resolveHtmlPath("index.html"));

  if (isDebug) mainWindow.webContents.openDevTools({ mode: "undocked" });

  mainWindow.on("ready-to-show", () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }

    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();

      if (code !== void 0) {
        setTimeout(() => {
          mainWindow?.webContents.send("migration-error");
        }, 800);
      }
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  createTray();
  menuBuilder = new MenuBuilder(mainWindow, locale.i18n);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: "deny" };
  });

  if (platform === "win32") {
    // windows only
    // Remove this if your app does not use auto updates
    // eslint-disable-next-line
    updater = new AppUpdater(mainWindow);
  }
};

/**
 * Add event listeners...
 */

app.on("window-all-closed", () => {
  if (setting.closer == Closer.Minimize) {
    platform === "darwin" && app.dock.hide();
  }

  if (setting.closer === Closer.Close) {
    app.quit();
  } else {
    updater?.clearMainBindings();

    updater = null;
  }
});

app
  .whenReady()
  .then(async () => {
    const [code, settingFromCache] = await Promise.all([updateSchema(), getSetting()]);
    const iVersions = await allInstalledNodeVersions({
      path: settingFromCache.directory
    });

    if (!setting) setting = settingFromCache;
    if (!installedVersions)
      installedVersions = iVersions.sort((version1, version2) => (gt(version2, version1) ? 1 : -1));

    if (!locale) {
      const appLocale = setting.locale;
      locale = loadLocale({ appLocale });
    }

    createWindow(code);
    app.on("activate", () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);

function createTray() {
  if (tray) return;

  const iconName =
    platform === "win32" ? join("windows", "icon.png") : join("unix", "iconTemplate.png");
  const icon = app.isPackaged
    ? join(process.resourcesPath, "assets", "icons", iconName)
    : join(__dirname, "../..", "assets", "icons", iconName);

  tray = new Tray(icon);
  tray.setToolTip("NVM-Desktop");

  platform === "win32" &&
    tray.on("click", () => {
      if (mainWindow === null) {
        createWindow();
        return;
      }

      if (!mainWindow.isVisible()) {
        mainWindow.show();
        return;
      }

      if (mainWindow.isFocused()) {
        mainWindow.minimize();
        return;
      }

      mainWindow.focus();
    });

  buildTray();
}

async function buildTray() {
  if (!tray) return;

  const [curVersion, projects] = await Promise.all([getCurrentVersion(), getProjects()]);

  const projectsMenu: MenuItemConstructorOptions[] = projects.slice(0, 5).map((project, index) => {
    const { name, path, version: projectVersion } = project;
    return {
      label: name,
      submenu: installedVersions.slice(0, 8).map((version) => ({
        label: `v${version}`,
        type: "radio",
        checked: projectVersion === version,
        async click() {
          const code = await syncProjectVersion(path, version);
          const newProjects = [...projects];
          newProjects[index] = {
            ...project,
            version: version,
            active: code === 200 ? true : false,
            updateAt: new Date().toISOString()
          };
          updateProjects(newProjects);

          mainWindow?.webContents.send("call-projects-update", newProjects, version);
        }
      }))
    };
  });

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "NVM-Desktop",
      click: () => {
        if (mainWindow === null) {
          createWindow();
          return;
        }

        if (!mainWindow.isVisible()) {
          mainWindow.show();
          return;
        }

        if (mainWindow.isFocused()) {
          mainWindow.minimize();
          return;
        }

        mainWindow.focus();
      }
    },
    { type: "separator" },
    {
      label: "Global (default)",
      submenu: installedVersions.slice(0, 8).map((version) => ({
        label: `v${version}`,
        type: "radio",
        checked: curVersion === version,
        async click() {
          if (mainWindow === null) return;
          await setCurrentVersion(version);
          mainWindow.webContents.send("current-version-update", version);
        }
      }))
    },
    ...projectsMenu,
    { type: "separator" },
    {
      label: `${locale.i18n("About")} NVM-Desktop`,
      role: "about"
    },
    {
      label: `${locale.i18n("Quit")} NVM-Desktop`,
      accelerator: "Command+Q",
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

const controllers = new Map<string, AbortController>();

// defer actions
Promise.resolve().then(() => {
  if (platform !== "darwin") {
    ipcMain.on("window:close", (_event) => {
      mainWindow && mainWindow.close();
    });

    ipcMain.on("window:minimize", (_event) => {
      mainWindow && mainWindow.minimize();
    });
  }

  ipcMain.on("setting-data-get", (event) => {
    event.returnValue = { ...setting, localeMessages: locale.messages };
  });

  ipcMain.handle("setting-data-set", async (_event, data: Partial<Nvmd.Setting>) => {
    if (data.locale !== setting.locale) {
      locale = loadLocale({ appLocale: data.locale });
      menuBuilder.buildMenu(locale.i18n);
      buildTray();
    }

    if (data.directory !== setting.directory) {
      const versions = await allInstalledNodeVersions({
        path: data.directory,
        refresh: true
      });

      installedVersions = versions.sort((version1, version2) => (gt(version2, version1) ? 1 : -1));
      buildTray();
    }

    setting = { ...setting, ...data };
    await setSetting(setting);
    return;
  });

  ipcMain.on("locale-data", (event) => {
    event.returnValue = locale.messages;
  });

  ipcMain.on("get-app-version", (event) => {
    event.returnValue = app.getVersion();
  });

  ipcMain.handle(
    "all-node-versions",
    async (_event, { id, fetch }: { id?: string; fetch?: boolean } = {}) => {
      const abortController = new AbortController();
      id && controllers.set(id, abortController);
      let result;
      try {
        result = await allNodeVersions({
          mirror: setting.mirror,
          signal: abortController.signal,
          fetch,
          timeout: {
            request: 1000 * 20,
            response: 1000 * 60
          }
        });
      } catch (err) {
        return Promise.reject(`${err.name}: ${err.message}`);
      } finally {
        id && controllers.delete(id);
      }
      return result;
    }
  );

  ipcMain.handle("controller:abort", async (_event, id) => {
    const controller = controllers.get(id);
    if (!controller) return;

    controller.abort();
    controllers.delete(id);
    return "successfully";
  });

  ipcMain.handle("installed-node-versions", async (_event, refresh: boolean = false) => {
    if (!refresh) return installedVersions;

    const versions = await allInstalledNodeVersions({
      path: setting.directory,
      refresh
    });

    installedVersions = versions.sort((version1, version2) => (gt(version2, version1) ? 1 : -1));

    refresh && buildTray();

    return versions;
  });

  ipcMain.handle("get-node", async (_event, { id, version }: { id: string; version: string }) => {
    const abortController = new AbortController();
    controllers.set(id, abortController);

    try {
      const result = await getNode(version, {
        output: setting.directory,
        mirror: setting.mirror,
        signal: abortController.signal,
        onProgress: (data) => {
          mainWindow?.webContents.send("get-node:progress", id, data);
        }
      });
      return result;
    } catch (err) {
      return Promise.reject(err.message);
    } finally {
      controllers.delete(id);
    }
  });

  ipcMain.handle(
    "uninstall-node-version",
    async (_event, version: string, current: boolean = false) => {
      return uninstallVersion({ path: setting.directory, version, current });
    }
  );

  ipcMain.handle("current-version", async (_event, fetch: boolean = false) => {
    const version = await getCurrentVersion(fetch);

    return version;
  });

  ipcMain.handle("use-version", async (_event, version: string) => {
    await setCurrentVersion(version);

    buildTray();
    return;
  });

  ipcMain.on("get-system-theme", (event) => {
    event.returnValue = nativeTheme.shouldUseDarkColors ? "dark" : "light";
  });

  ipcMain.handle(
    "open-folder-selecter",
    async (
      _event,
      { title, multiple, project }: { title: string; multiple?: boolean; project?: boolean }
    ) => {
      const properties: OpenDialogOptions["properties"] = [
        "openDirectory",
        "createDirectory",
        "showHiddenFiles"
      ];
      multiple && properties.push("multiSelections");
      const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow!, {
        title,
        properties: properties
      });

      if (canceled) return { canceled, filePaths };

      if (!project) return { canceled, filePaths };

      const versions = await Promise.all(filePaths.map((path) => getVersion(path)));

      return { canceled, filePaths, versions };
    }
  );

  ipcMain.handle("get-projects", async (_event, load: boolean = false) => {
    return getProjects(load);
  });

  ipcMain.handle("update-projects", async (_event, projects: Nvmd.Project[], path?: string) => {
    await updateProjects(projects, path);

    buildTray();
    return;
  });

  ipcMain.handle("sync-project-version", (_event, path: string, version: string) => {
    return syncProjectVersion(path, version);
  });
});

// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { app, contextBridge, ipcRenderer } from 'electron';
import type { ProgressInfo, UpdateInfo } from 'electron-updater';

type OnUpdateProgressCallback = (progress: ProgressInfo) => void;
type OnProgressCallback = (id: string, data: Nvmd.ProgressData) => void;
type OnThemeChangedCallback = (theme: string) => void;

let onUpdateProgress: OnUpdateProgressCallback | null = null,
  onProgress: OnProgressCallback | null = null,
  onThemeChanged: OnThemeChangedCallback | null = null;

ipcRenderer.on('download-progress', (_event, progress: ProgressInfo) => {
  onUpdateProgress?.(progress);
});

ipcRenderer.on('update-error', (_event, err) => {
  console.log(err);
});

ipcRenderer.on(
  'get-node:progress',
  (_event, id: string, progress: Nvmd.ProgressData) => {
    onProgress?.(id, progress);
  },
);

ipcRenderer.on('native-theme:changed', (_event, theme: string) => {
  onThemeChanged && onThemeChanged(theme);
});

const electronHandler = {
  platform: process.platform,
  arch: process.arch,
  version: ipcRenderer.sendSync('get-app-version') as string,

  windowClose: () => {
    ipcRenderer.send('window:close');
  },
  windowMinimize: () => {
    ipcRenderer.send('window:minimize');
  },

  checkForUpdates: () =>
    ipcRenderer.invoke('check-for-updates') as Promise<UpdateInfo | null>,
  comfirmUpdate: () =>
    ipcRenderer.invoke('confirm-update') as Promise<string[]>,
  makeUpdateNow() {
    ipcRenderer.send('make-update-now');
  },
  onRegistUpdateProgress(callback: OnUpdateProgressCallback) {
    onUpdateProgress = callback;
  },

  getSettingData: () =>
    ipcRenderer.sendSync('setting-data-get') as Nvmd.Setting & {
      localeMessages: I18n.Message;
    },
  updateSettingData: (setting: Nvmd.Setting) =>
    ipcRenderer.invoke('setting-data-set', setting) as Promise<void>,
  getLocaleData: () => ipcRenderer.sendSync('locale-data') as I18n.Message,

  getAllNodeVersions: async (arg?: { id?: string; fetch?: boolean }) =>
    ipcRenderer.invoke('all-node-versions', arg) as Promise<Nvmd.Versions>,

  getInstalledNodeVersions: async (
    refresh: boolean = false,
  ): Promise<string[]> =>
    ipcRenderer.invoke('installed-node-versions', refresh),

  getNode: async (args: { id: string; version: string }) =>
    ipcRenderer.invoke('get-node', args),
  controllerAbort: (id: string) => ipcRenderer.invoke('controller:abort', id),

  useNodeVersion: (version: string) =>
    ipcRenderer.invoke('use-version', version),
  getCurrentVersion: () => ipcRenderer.invoke('current-version'),

  onRegistProgress: (onProgressSource: OnProgressCallback) => {
    onProgress = onProgressSource;
  },

  uninstallVersion: (version: string, current: boolean = false) =>
    ipcRenderer.invoke('uninstall-node-version', version, current),

  getSystemTheme: () => ipcRenderer.sendSync('get-system-theme') as string,
  onRegistThemeCallback: (callback: OnThemeChangedCallback) => {
    onThemeChanged = callback;
  },
};

contextBridge.exposeInMainWorld('Context', electronHandler);

export type ElectronHandler = typeof electronHandler;

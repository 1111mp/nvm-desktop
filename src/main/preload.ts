// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer } from 'electron';

type OnProgressCallback = (id: string, data: Nvmd.ProgressData) => void;
type OnThemeChangedCallback = (theme: string) => void;

let onProgress: OnProgressCallback | null = null,
  onThemeChanged: OnThemeChangedCallback | null = null;

ipcRenderer.on(
  'get-node:progress',
  (_event, id: string, progress: Nvmd.ProgressData) => {
    onProgress && onProgress(id, progress);
  },
);

ipcRenderer.on('native-theme:changed', (_event, theme: string) => {
  onThemeChanged && onThemeChanged(theme);
});

const electronHandler = {
  platform: process.platform,
  arch: process.arch,

  windowClose: () => {
    ipcRenderer.send('window:close');
  },
  windowMinimize: () => {
    ipcRenderer.send('window:minimize');
  },

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

// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer } from 'electron'

import type { OpenDialogReturnValue } from 'electron'
import type { ProgressInfo, UpdateInfo } from 'electron-updater'

type OnCheckUpdateResultCallback = (info: UpdateInfo | 'update-not-available') => void
type OnUpdateProgressCallback = (progress: ProgressInfo) => void
type OnProgressCallback = (id: string, data: Nvmd.ProgressData) => void
type OnThemeChangedCallback = (theme: string) => void
type OnCurVersionChange = (version: string) => void
type OnProjectUpdate = (projects: Nvmd.Project[], version: string) => void
type OnMigrationError = () => void

let onCheckUpdateResult: OnCheckUpdateResultCallback | null = null,
  onUpdateProgress: OnUpdateProgressCallback | null = null,
  onProgress: OnProgressCallback | null = null,
  onThemeChanged: OnThemeChangedCallback | null = null,
  onCurVersionChange: OnCurVersionChange | null = null,
  onProjectUpdate: OnProjectUpdate | null = null,
  onMigrationError: OnMigrationError | null = null

ipcRenderer.on('update-available', (_event, info: UpdateInfo) => {
  onCheckUpdateResult?.(info)
})

ipcRenderer.on('update-not-available', (_event, info: 'update-not-available') => {
  onCheckUpdateResult?.(info)
})

ipcRenderer.on('download-progress', (_event, progress: ProgressInfo) => {
  onUpdateProgress?.(progress)
})

ipcRenderer.on('update-error', (_event, err) => {
  console.log(err)
})

ipcRenderer.on('get-node:progress', (_event, id: string, progress: Nvmd.ProgressData) => {
  onProgress?.(id, progress)
})

ipcRenderer.on('native-theme:changed', (_event, theme: string) => {
  onThemeChanged?.(theme)
})

ipcRenderer.on('current-version-update', (_evnet, version: string) => {
  onCurVersionChange?.(version)
})

ipcRenderer.on('call-projects-update', (_evnet, projects: Nvmd.Project[], version: string) => {
  onProjectUpdate?.(projects, version)
})

ipcRenderer.on('migration-error', (_evnet) => {
  onMigrationError?.()
})

const electronHandler = {
  platform: process.platform,
  arch: process.arch,
  version: ipcRenderer.sendSync('get-app-version') as string,

  windowClose: () => {
    ipcRenderer.send('window:close')
  },
  windowMinimize: () => {
    ipcRenderer.send('window:minimize')
  },

  checkForUpdates: () => ipcRenderer.invoke('check-for-updates') as Promise<UpdateInfo | null>,
  comfirmUpdate: () => ipcRenderer.invoke('confirm-update') as Promise<string[]>,
  makeUpdateNow() {
    ipcRenderer.send('make-update-now')
  },
  onCheckUpdateResultCallback(callback: OnCheckUpdateResultCallback) {
    onCheckUpdateResult = callback
  },
  onRegistUpdateProgress(callback: OnUpdateProgressCallback) {
    onUpdateProgress = callback
  },

  getSettingData: () =>
    ipcRenderer.sendSync('setting-data-get') as Nvmd.Setting & {
      localeMessages: I18n.Message
    },
  updateSettingData: (setting: Nvmd.Setting) =>
    ipcRenderer.invoke('setting-data-set', setting) as Promise<void>,
  getLocaleData: () => ipcRenderer.sendSync('locale-data') as I18n.Message,

  getAllNodeVersions: async (arg?: { id?: string; fetch?: boolean }) =>
    ipcRenderer.invoke('all-node-versions', arg) as Promise<Nvmd.Versions>,

  getInstalledNodeVersions: async (refresh: boolean = false): Promise<string[]> =>
    ipcRenderer.invoke('installed-node-versions', refresh),

  getNode: async (args: { id: string; version: string }) => ipcRenderer.invoke('get-node', args),
  controllerAbort: (id: string) => ipcRenderer.invoke('controller:abort', id),

  useNodeVersion: (version: string) => ipcRenderer.invoke('use-version', version),
  getCurrentVersion: (fetch: boolean = false) => ipcRenderer.invoke('current-version', fetch),
  onRegistCurVersionChange: (callback: OnCurVersionChange) => {
    onCurVersionChange = callback
  },

  onRegistProgress: (onProgressSource: OnProgressCallback) => {
    onProgress = onProgressSource
  },

  uninstallVersion: (version: string, current: boolean = false) =>
    ipcRenderer.invoke('uninstall-node-version', version, current),

  getSystemTheme: () => ipcRenderer.sendSync('get-system-theme') as string,
  onRegistThemeCallback: (callback: OnThemeChangedCallback) => {
    onThemeChanged = callback
  },

  openFolderSelecter: ({ title, project = false }: { title: string; project?: boolean }) =>
    ipcRenderer.invoke('open-folder-selecter', { title, project }) as Promise<
      OpenDialogReturnValue & { version?: string }
    >,
  getProjects: (load: boolean = false) =>
    ipcRenderer.invoke('get-projects', load) as Promise<Nvmd.Project[]>,
  updateProjects: (projects: Nvmd.Project[], path?: string) =>
    ipcRenderer.invoke('update-projects', projects, path) as Promise<void>,
  syncProjectVersion: (path: string, version: string) =>
    ipcRenderer.invoke('sync-project-version', path, version) as Promise<404 | 200>,
  onRegistProjectUpdate: (callback: OnProjectUpdate | null) => {
    onProjectUpdate = callback
  },

  onRegistMigrationError: (callback: OnMigrationError) => {
    onMigrationError = callback
  }
}

contextBridge.exposeInMainWorld('Context', electronHandler)

export type ElectronHandler = typeof electronHandler

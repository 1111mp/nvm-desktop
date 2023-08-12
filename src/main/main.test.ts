import { ipcMain, nativeTheme } from 'electron';
import { getSetting } from './utils/setting';

// @ts-ignore
import('wdio-electron-service/main');

import('./main');

ipcMain.handle('wdio-electron', (_event, name: string, ...args: unknown[]) => {
  switch (name) {
    case 'get-system-theme': {
      return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
    }

    case 'setting-data-get': {
      return getSetting();
    }

    default: {
      return name;
    }
  }
});

import { clearMocks, mockIPC, mockWindows } from '@tauri-apps/api/mocks';
import { afterEach, beforeEach } from 'vitest';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  mockWindows('main');
  // Unhandled IPC must fail loudly instead of silently returning undefined.
  mockIPC((command) => {
    throw new Error(`Unhandled Tauri command: ${command}`);
  });
});

afterEach(() => {
  clearMocks();
  Reflect.deleteProperty(window, '__NVMD_INITIAL_SETTINGS__');
  Reflect.deleteProperty(window, '__NVMD_INITIAL_THEME__');
});

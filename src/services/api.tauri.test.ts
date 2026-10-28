import { mockIPC } from '@tauri-apps/api/mocks';
import { expect, test, vi } from 'vitest';
import { Closer, SystemTheme, Themes } from '@/types';
import { getAppInitialData } from './api';

const settings: Nvmd.Setting = {
  closer: Closer.Close,
  coder: 'code',
  directory: '/isolated/versions',
  locale: 'en',
  mirror: 'https://nodejs.org/dist',
  theme: Themes.Light,
};

function mockStartup() {
  const ipc = vi.fn((command: string) => {
    if (command === 'read_settings') return settings;
    if (command === 'plugin:window|theme') return 'dark';
    throw new Error(`Unexpected command: ${command}`);
  });
  mockIPC(ipc);
  return ipc;
}

test('startup consumes injected data once; reload reads fresh settings and native theme', async () => {
  const ipc = mockStartup();
  window.__NVMD_INITIAL_SETTINGS__ = settings;
  window.__NVMD_INITIAL_THEME__ = SystemTheme.Light;
  sessionStorage.setItem('__NVMD_INITIAL__', 'no');
  await expect(getAppInitialData()).resolves.toEqual([
    settings,
    SystemTheme.Light,
  ]);
  expect(ipc).not.toHaveBeenCalled();
  expect(sessionStorage.getItem('__NVMD_INITIAL__')).toBe('yes');

  await expect(getAppInitialData()).resolves.toEqual([
    settings,
    SystemTheme.Dark,
  ]);
  expect(ipc.mock.calls.map(([command]) => command)).toEqual([
    'read_settings',
    'plugin:window|theme',
  ]);
});

test('missing injected data falls back to IPC even on the first load', async () => {
  const ipc = mockStartup();
  sessionStorage.setItem('__NVMD_INITIAL__', 'no');
  await expect(getAppInitialData()).resolves.toEqual([
    settings,
    SystemTheme.Dark,
  ]);
  expect(ipc).toHaveBeenCalledTimes(2);
});

test('startup failures propagate instead of returning partial initial data', async () => {
  mockIPC(() => {
    throw new Error('settings unreadable');
  });
  await expect(getAppInitialData()).rejects.toThrow('settings unreadable');
});

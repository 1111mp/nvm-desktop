import { mockIPC } from '@tauri-apps/api/mocks';
import { expect, test, vi } from 'vitest';
import {
  batchUpdateProjectVersion,
  installedListWithTray,
  vSetCurrent,
} from './cmds';

test('refreshing the tray requests fresh installed versions', async () => {
  const ipc = vi.fn(() => ['22.0.0']);
  mockIPC(ipc);
  await expect(installedListWithTray(true)).resolves.toEqual(['22.0.0']);
  expect(ipc).toHaveBeenCalledWith('installed_list', {
    fetch: true,
    tray: true,
  });
});

test('a failed version switch rejects so callers can retain their current state', async () => {
  mockIPC(() => {
    throw new Error('version is not installed');
  });
  await expect(vSetCurrent('22.0.0')).rejects.toThrow(
    'version is not installed',
  );
});

test('batch project writes preserve paths containing spaces and Unicode', async () => {
  const ipc = vi.fn(() => undefined);
  mockIPC(ipc);
  const paths = ['/projects/my app', '/projects/项目'];
  await batchUpdateProjectVersion(paths, '22.0.0');
  expect(ipc).toHaveBeenCalledWith('batch_update_project_version', {
    paths,
    version: '22.0.0',
  });
});

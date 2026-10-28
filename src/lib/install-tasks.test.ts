import { expect, test } from 'vitest';
import {
  isInstallActive,
  mergeInstallTasks,
  type InstallTask,
} from './install-tasks';

const task = (
  id: number,
  revision: number,
  phase: InstallTask['phase'] = 'download',
): InstallTask => ({
  id,
  revision,
  phase,
  version: '22.0.0',
  arch: 'arm64',
  directory: '/tmp/node',
  transferred: 1,
  total: 10,
});

test('a late snapshot cannot roll back completion or resurrect a cancelled task', () => {
  const complete = task(1, 8, 'complete');
  const cancelled = task(2, 5, 'cancelled');
  expect(
    mergeInstallTasks([complete, cancelled], [task(1, 2), task(2, 1)]),
  ).toEqual([complete, cancelled]);
});

test('concurrent task updates remain isolated and snapshots fill missing tasks', () => {
  const first = task(1, 4);
  const second = task(2, 6, 'unzip');
  expect(
    mergeInstallTasks([first, task(2, 1)], [second, task(3, 0, 'queued')]),
  ).toEqual([first, second, task(3, 0, 'queued')]);
});

test('cancelling tasks retain their slot until the backend finishes cleanup', () => {
  expect(isInstallActive(task(1, 1, 'cancelling'))).toBe(true);
  for (const phase of ['complete', 'failed', 'cancelled'] as const)
    expect(isInstallActive(task(1, 2, phase))).toBe(false);
});

test('retry history keeps the latest attempt per version and installation directory', async () => {
  const { latestInstallTasks } = await import('./install-tasks');
  const oldFailure = task(1, 2, 'failed');
  const retry = task(2, 0, 'queued');
  const otherDirectory = {
    ...task(3, 0, 'failed'),
    directory: '/tmp/other-node',
  };
  expect(latestInstallTasks([oldFailure, retry, otherDirectory])).toEqual([
    retry,
    otherDirectory,
  ]);
});

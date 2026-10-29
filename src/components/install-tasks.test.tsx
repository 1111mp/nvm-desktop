import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import '@/services/i18n';
import {
  InstallTasksButton,
  InstallTasksProvider,
  useInstallTasks,
} from './install-tasks';
import type { InstallTask } from '@/lib/install-tasks';

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  listener: undefined as
    | undefined
    | ((event: { payload: InstallTask }) => void),
}));
vi.mock('@tauri-apps/api/core', async (original) => ({
  ...(await original<typeof import('@tauri-apps/api/core')>()),
  invoke: mocks.invoke,
}));
vi.mock('@/services/api', async (original) => ({
  ...(await original<typeof import('@/services/api')>()),
  getCurrent: () => ({
    listen: async (_event: string, listener: typeof mocks.listener) => {
      mocks.listener = listener;
      return () => {};
    },
  }),
}));
const task: InstallTask = {
  id: 7,
  version: '22.0.0',
  arch: 'arm64',
  directory: '/tmp/node',
  phase: 'download',
  total: 100,
  transferred: 20,
  revision: 1,
  batchId: 1,
};
function Probe({ version = '22.0.0' }: { version?: string }) {
  const { enqueue } = useInstallTasks();
  return (
    <button onClick={() => void enqueue([{ version, arch: 'arm64' }])}>
      Add install
    </button>
  );
}
beforeEach(() => {
  mocks.listener = undefined;
  mocks.invoke.mockReset();
  mocks.invoke.mockImplementation(async (command: string) =>
    command === 'install_tasks'
      ? []
      : command === 'enqueue_installs'
        ? [task]
        : undefined,
  );
});

test('hiding the queue preserves tasks and cancellation addresses the individual task', async () => {
  const user = userEvent.setup();
  render(
    <InstallTasksProvider>
      <Probe />
      <InstallTasksButton />
    </InstallTasksProvider>,
  );
  await user.click(screen.getByRole('button', { name: 'Add install' }));
  expect(await screen.findByText('Downloading')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Hide' }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  await act(async () => {
    mocks.listener?.({ payload: { ...task, revision: 2, phase: 'unzip' } });
  });
  await user.click(screen.getByRole('button', { name: /Install tasks/ }));
  expect(await screen.findByText('Extracting')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Cancel v22.0.0' }));
  expect(mocks.invoke).toHaveBeenCalledWith('cancel_install_task', { id: 7 });
});

test('late snapshots cannot replace newer completion events received during startup', async () => {
  let resolveSnapshot!: (tasks: InstallTask[]) => void;
  mocks.invoke.mockImplementation((command: string) =>
    command === 'install_tasks'
      ? new Promise<InstallTask[]>((resolve) => {
          resolveSnapshot = resolve;
        })
      : Promise.resolve(),
  );
  const user = userEvent.setup();
  render(
    <InstallTasksProvider>
      <InstallTasksButton />
    </InstallTasksProvider>,
  );
  await waitFor(() =>
    expect(mocks.invoke).toHaveBeenCalledWith('install_tasks'),
  );
  await act(async () => {
    mocks.listener?.({ payload: { ...task, revision: 5, phase: 'complete' } });
    resolveSnapshot([task]);
  });
  await user.click(screen.getByRole('button', { name: /Install tasks/ }));
  expect(await screen.findByText('Installed', { exact: true })).toBeVisible();
  expect(screen.queryByText('Downloading')).not.toBeInTheDocument();
});

test('retry binds the original directory and an admission failure leaves the task available', async () => {
  const user = userEvent.setup();
  mocks.invoke.mockImplementation(async (command: string) => {
    if (command === 'install_tasks')
      return [{ ...task, phase: 'failed', error: 'Connection timed out' }];
    if (command === 'enqueue_installs')
      throw new Error('The installation directory has changed');
    return undefined;
  });
  render(
    <InstallTasksProvider>
      <InstallTasksButton />
    </InstallTasksProvider>,
  );
  await user.click(
    await screen.findByRole('button', { name: /Install tasks/ }),
  );
  await user.click(screen.getByRole('button', { name: /^Retry$/ }));
  await waitFor(() =>
    expect(mocks.invoke).toHaveBeenCalledWith('enqueue_installs', {
      requests: [
        {
          version: task.version,
          arch: task.arch,
          directory: task.directory,
          batchId: task.batchId,
        },
      ],
    }),
  );
  await waitFor(() =>
    expect(screen.getByRole('button', { name: /^Retry$/ })).toBeEnabled(),
  );
  expect(screen.getByText('Connection timed out')).toBeVisible();
});

test('starting a new batch excludes an earlier failure from its list and retry actions', async () => {
  const oldFailure = { ...task, phase: 'failed', error: 'Old batch failure' };
  const next = {
    ...task,
    id: 8,
    batchId: 8,
    version: '24.0.0',
    phase: 'queued',
    revision: 0,
  };
  mocks.invoke.mockImplementation(async (command: string) =>
    command === 'install_tasks'
      ? [oldFailure]
      : command === 'enqueue_installs'
        ? [next]
        : undefined,
  );
  const user = userEvent.setup();
  render(
    <InstallTasksProvider>
      <Probe version='24.0.0' />
      <InstallTasksButton />
    </InstallTasksProvider>,
  );
  await user.click(
    await screen.findByRole('button', { name: /Install tasks/ }),
  );
  expect(screen.getByText('Old batch failure')).toBeVisible();
  await user.click(screen.getByRole('button', { name: /^OK$/ }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  await user.click(screen.getByRole('button', { name: 'Add install' }));
  expect(await screen.findByText('v24.0.0')).toBeVisible();
  expect(screen.queryByText('Old batch failure')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Retry failed' }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByText('Installed 0 / 1 · Failed 0 · Cancelled 0'),
  ).toBeVisible();
  // A late update for the historical task must not reintroduce it.
  await act(async () => {
    mocks.listener?.({
      payload: {
        ...task,
        phase: 'failed',
        revision: 9,
        error: 'Old batch failure',
      },
    });
  });
  expect(screen.queryByText('Old batch failure')).not.toBeInTheDocument();
});

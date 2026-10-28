import { takeScreenshot } from '@/test/screenshot';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { expect, test, vi } from 'vitest';
import '@/services/i18n';
import { InstallTasksButton, InstallTasksProvider } from './install-tasks';
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

const fixture = (id: number, phase: InstallTask['phase']): InstallTask => ({
  id,
  phase,
  revision: 1,
  version: `22.0.${id}`,
  arch: 'arm64',
  directory: '/tmp/node',
  total: 42 * 1024 ** 2,
  transferred: id * 7 * 1024 ** 2,
  error: phase === 'failed' ? 'Connection timed out' : undefined,
});

test('parallel task progress stays readable and cancelling one task leaves the rest available', async () => {
  mocks.invoke.mockImplementation(async (command: string) =>
    command === 'install_tasks'
      ? [
          fixture(1, 'download'),
          fixture(2, 'download'),
          fixture(3, 'unzip'),
          fixture(4, 'queued'),
          fixture(5, 'failed'),
        ]
      : undefined,
  );
  await page.viewport(1100, 800);
  const screen = await render(
    <InstallTasksProvider>
      <InstallTasksButton />
    </InstallTasksProvider>,
  );
  await screen.getByRole('button', { name: /Install tasks/ }).click();
  await expect
    .element(screen.getByText('Downloading 2 · Extracting 1 · Waiting 1'))
    .toBeVisible();
  await expect
    .element(
      screen.getByRole('progressbar', { name: 'Download Progress v22.0.1' }),
    )
    .toBeVisible();
  await expect.element(screen.getByText('Connection timed out')).toBeVisible();
  await takeScreenshot('nvmd-install-tasks');
  await screen.getByRole('button', { name: 'Cancel v22.0.1' }).click();
  expect(mocks.invoke).toHaveBeenCalledWith('cancel_install_task', { id: 1 });
  await expect
    .element(screen.getByRole('button', { name: 'Cancel v22.0.2' }))
    .toBeEnabled();
  await screen.getByRole('button', { name: 'Hide' }).click();
  await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
  await screen.getByRole('button', { name: /Install tasks/ }).click();
  await expect.element(screen.getByText('Connection timed out')).toBeVisible();
});

test('task transitions keep the dialog, footer and task rows stationary', async () => {
  mocks.invoke.mockImplementation(async (command: string) =>
    command === 'install_tasks'
      ? [fixture(1, 'queued'), fixture(2, 'queued')]
      : undefined,
  );
  await page.viewport(900, 700);
  const screen = await render(
    <InstallTasksProvider>
      <InstallTasksButton />
    </InstallTasksProvider>,
  );
  await screen.getByRole('button', { name: /Install tasks/ }).click();
  await expect
    .element(screen.getByText('Downloading 0 · Extracting 0 · Waiting 2'))
    .toBeVisible();
  const dialog = screen.getByRole('dialog').element();
  await Promise.all(
    dialog
      .getAnimations({ subtree: true })
      .filter(
        (animation) =>
          animation.effect?.getComputedTiming().iterations !== Infinity,
      )
      .map((animation) => animation.finished.catch(() => {})),
  );
  const measure = () => ({
    dialog: dialog.getBoundingClientRect().toJSON(),
    footer: dialog
      .querySelector('[data-slot="dialog-footer"]')!
      .getBoundingClientRect()
      .toJSON(),
    secondTask: screen
      .getByText('v22.0.2')
      .element()
      .getBoundingClientRect()
      .toJSON(),
  });
  // Wait for the opening scale animation before measuring layout stability.
  await expect.poll(() => dialog.getBoundingClientRect().height).toBe(408);
  const initial = measure();
  for (const [index, phase] of (
    [
      'download',
      'verify',
      'waiting-extract',
      'unzip',
      'failed',
      'complete',
      'cancelled',
    ] as const
  ).entries()) {
    mocks.listener?.({
      payload: {
        ...fixture(1, phase),
        revision: index + 2,
        error:
          phase === 'failed'
            ? 'A long connection error. '.repeat(20)
            : undefined,
      },
    });
    await expect
      .element(
        screen.getByText(
          {
            download: 'Downloading',
            verify: 'Verifying package',
            'waiting-extract': 'Waiting to extract',
            unzip: 'Extracting',
            failed: 'Failed',
            complete: 'Installed',
            cancelled: 'Cancelled',
          }[phase],
          { exact: true },
        ),
      )
      .toBeVisible();
    expect(measure()).toEqual(initial);
  }
  mocks.listener?.({ payload: { ...fixture(2, 'complete'), revision: 2 } });
  await expect
    .element(screen.getByRole('button', { name: 'OK', exact: true }))
    .toBeVisible();
  expect(measure()).toEqual(initial);
  await takeScreenshot('nvmd-install-tasks-stable');
});

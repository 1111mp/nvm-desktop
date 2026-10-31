import { takeScreenshot } from '@/test/screenshot';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { expect, test, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import '@/services/i18n';
import { TooltipProvider } from '@/components/ui';
import { Versions } from './index';
import { preferredArchitecture } from '@/lib/install-tasks';
import { BatchInstallForm } from '@/components/batch-install-form';
import { InstallTasksProvider } from '@/components/install-tasks';
import { Dialog, DialogContent } from '@/components/ui';
import type { InstallRequest } from '@/lib/install-tasks';

const mocks = vi.hoisted(() => ({
  enqueue: vi.fn(async (_requests?: InstallRequest[]) => {}),
  show: vi.fn(),
}));
vi.mock('@/app-context', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/app-context')>()),
  useAppContext: () => ({
    settings: { directory: '/tmp/nvmd', mirror: 'https://nodejs.org/dist' },
  }),
}));
vi.mock('@tauri-apps/api/core', async (original) => ({
  ...(await original<typeof import('@tauri-apps/api/core')>()),
  invoke: async (command: string, args?: { requests: InstallRequest[] }) => {
    if (command === 'install_tasks') return [];
    if (command === 'enqueue_installs') {
      await mocks.enqueue(args!.requests);
      return args!.requests.map((request, index) => ({
        ...request,
        id: index + 1,
        phase: 'queued',
        directory: '/tmp/nvmd',
        transferred: 0,
        total: 0,
        revision: 0,
        batchId: 1,
      }));
    }
    throw new Error(command);
  },
}));
vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/api')>()),
  getCurrent: () => ({ listen: async () => () => {} }),
}));
vi.mock('@/services/cmds', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/cmds')>()),
  installedList: async () => ['24.0.0'],
  installedListWithTray: async () => [],
  vCurrent: async () => '24.0.0',
  versionList: async () => [],
  vSetCurrent: async () => {},
  uninstallNode: async () => {},
  installNode: async () => '',
  installNodeCancel: async () => {},
}));

const release = (version: string, supported = true): Nvmd.Version =>
  ({
    version,
    files: supported
      ? [
          'osx-arm64-tar',
          'osx-x64-tar',
          'linux-arm64',
          'linux-x64',
          'win-arm64-zip',
          'win-x64-zip',
        ]
      : [],
    date: '2026-01-01',
    lts: false,
    npm: '10.0.0',
    v8: '12.0.0',
  }) as Nvmd.Version;
const releases = [
  release('v24.0.0'),
  release('v22.0.0'),
  release('v20.0.0'),
  release('v18.0.0', false),
];

test('bulk selection respects filters, installed releases and platform support', async () => {
  await page.viewport(1100, 800);
  const router = createMemoryRouter([
    {
      path: '/',
      loader: () => ['24.0.0', releases, ['24.0.0']],
      Component: Versions,
      HydrateFallback: () => null,
    },
  ]);
  const screen = await render(
    <TooltipProvider>
      <InstallTasksProvider>
        <div className='h-screen bg-background p-6 text-foreground'>
          <RouterProvider router={router} />
        </div>
      </InstallTasksProvider>
    </TooltipProvider>,
  );
  await screen
    .getByRole('button', { name: 'Batch install', exact: true })
    .click();
  await expect
    .element(
      screen.getByRole('checkbox', { name: 'Select v24.0.0', exact: true }),
    )
    .toBeDisabled();
  await expect
    .element(
      screen.getByRole('checkbox', { name: 'Select v18.0.0', exact: true }),
    )
    .toBeDisabled();
  await screen
    .getByRole('checkbox', { name: 'Select v22.0.0', exact: true })
    .hover();
  const checkbox = screen
    .getByRole('checkbox', { name: 'Select v22.0.0', exact: true })
    .element();
  const checkboxBounds = checkbox.getBoundingClientRect();
  const rowBounds = checkbox.closest('tr')!.getBoundingClientRect();
  expect(
    Math.abs(
      (checkboxBounds.top + checkboxBounds.bottom) / 2 -
        (rowBounds.top + rowBounds.bottom) / 2,
    ),
  ).toBeLessThan(1);
  await takeScreenshot('nvmd-selection-hover');
  await screen
    .getByRole('checkbox', { name: 'Select v22.0.0', exact: true })
    .click();
  await expect
    .element(
      screen.getByRole('checkbox', {
        name: 'Select all 2 installable filtered versions',
      }),
    )
    .toHaveAttribute('aria-checked', 'mixed');
  await screen.getByRole('button', { name: 'Sort Version' }).click();
  await screen.getByRole('menuitem', { name: 'Ascending' }).click();
  await expect
    .element(
      screen.getByRole('checkbox', { name: 'Select v22.0.0', exact: true }),
    )
    .toBeChecked();
  await expect
    .element(
      screen.getByRole('checkbox', { name: 'Select v20.0.0', exact: true }),
    )
    .not.toBeChecked();
  await screen
    .getByRole('checkbox', {
      name: 'Select all 2 installable filtered versions',
    })
    .click();
  await expect.element(screen.getByText(/^2 versions selected/)).toBeVisible();
  const search = screen.getByPlaceholder('Search Version');
  await search.fill('22.0');
  await expect.element(screen.getByText(/1 outside this filter/)).toBeVisible();
  await screen
    .getByRole('checkbox', {
      name: 'Select all 1 installable filtered versions',
    })
    .click();
  await expect.element(screen.getByText(/^1 versions selected/)).toBeVisible();
  await screen
    .getByRole('checkbox', { name: 'Select v22.0.0', exact: true })
    .click();
  await expect.element(screen.getByText(/^2 versions selected/)).toBeVisible();
  await screen.getByRole('button', { name: 'Install selected (2)' }).click();
  await expect.element(screen.getByRole('dialog')).toBeVisible();
  await expect
    .element(
      screen.getByText('Your current Node.js version will stay selected.'),
    )
    .toBeVisible();
  await expect
    .poll(
      () => screen.getByRole('dialog').element().getBoundingClientRect().height,
    )
    .toBe(408);
  await takeScreenshot('nvmd-batch-confirm-light');
  document.documentElement.classList.add('dark');
  await Promise.all(
    document.documentElement
      .getAnimations({ subtree: true })
      .filter(
        (animation) =>
          animation.effect?.getComputedTiming().iterations !== Infinity,
      )
      .map((animation) => animation.finished.catch(() => {})),
  );
  await takeScreenshot('nvmd-batch-confirm-dark');
  document.documentElement.classList.remove('dark');
  const confirmationPopup = screen.getByRole('dialog').element();
  const backdrop = document.querySelector('[data-slot="dialog-overlay"]');
  const previousHeight = confirmationPopup.getBoundingClientRect().height;
  await screen
    .getByRole('dialog')
    .getByRole('button', { name: 'Install selected (2)' })
    .click();
  await expect
    .element(
      screen.getByRole('heading', { name: 'Install tasks', exact: true }),
    )
    .toBeVisible();
  expect(screen.getByRole('dialog').element()).toBe(confirmationPopup);
  expect(document.querySelector('[data-slot="dialog-overlay"]')).toBe(backdrop);
  expect(document.querySelectorAll('[data-slot="dialog-overlay"]').length).toBe(
    1,
  );
  expect(confirmationPopup.getBoundingClientRect().height).toBe(previousHeight);
  expect(confirmationPopup.hasAttribute('data-starting-style')).toBe(false);
  expect(mocks.enqueue).toHaveBeenCalledWith([
    { version: '22.0.0', arch: preferredArchitecture, directory: '/tmp/nvmd' },
    { version: '20.0.0', arch: preferredArchitecture, directory: '/tmp/nvmd' },
  ]);
});

test.skipIf(preferredArchitecture !== 'arm64')(
  'unsupported preferred architecture requires an explicit choice and fits a short window',
  async () => {
    await page.viewport(800, 600);
    const screen = await render(
      <Dialog open>
        <DialogContent>
          <BatchInstallForm
            versions={[
              {
                ...release('v16.0.0'),
                files: ['osx-x64-tar', 'linux-x64', 'win-x64-zip'],
              },
            ]}
            onDone={() => {}}
            onStart={async () => {}}
            onBack={() => {}}
          />
        </DialogContent>
      </Dialog>,
    );
    await expect
      .element(screen.getByRole('button', { name: 'Install selected (1)' }))
      .toBeDisabled();
    await expect
      .element(screen.getByText(/is unavailable for this release/))
      .toBeVisible();
    await screen
      .getByRole('combobox', { name: 'Architecture v16.0.0' })
      .click();
    await screen.getByRole('option', { name: 'x64' }).click();
    await expect
      .element(screen.getByRole('button', { name: 'Install selected (1)' }))
      .toBeEnabled();
    await expect
      .element(screen.getByRole('option', { name: 'x64' }))
      .not.toBeInTheDocument();
    await takeScreenshot('nvmd-batch-small');
  },
);

test('density expands the table and stays synchronized across version pages', async () => {
  localStorage.removeItem('nvmd-version-density');
  await page.viewport(1100, 800);
  const { Component: Installed } = await import('../installed');
  const catalog = Array.from({ length: 60 }, (_, index) =>
    release(`v${60 - index}.0.0`),
  );
  const data = () => ['24.0.0', catalog, ['24.0.0']];
  const router = createMemoryRouter(
    [
      {
        path: '/versions',
        loader: data,
        Component: Versions,
        HydrateFallback: () => null,
      },
      {
        path: '/installed',
        loader: data,
        Component: Installed,
        HydrateFallback: () => null,
      },
    ],
    { initialEntries: ['/versions'] },
  );
  const screen = await render(
    <TooltipProvider>
      <InstallTasksProvider>
        <div className='h-screen bg-background p-6 text-foreground'>
          <RouterProvider router={router} />
        </div>
      </InstallTasksProvider>
    </TooltipProvider>,
  );
  const tableHeight = () =>
    document
      .querySelector('table')!
      .parentElement!.parentElement!.getBoundingClientRect().height;
  const rowHeight = () =>
    document.querySelector('tbody tr')!.getBoundingClientRect().height;
  await expect.poll(() => document.querySelector('tbody tr')).toBeTruthy();
  const comfortableHeight = tableHeight();
  const comfortableRow = rowHeight();
  await screen.getByRole('button', { name: 'List density' }).click();
  await screen
    .getByRole('menuitemradio', { name: 'Compact', exact: true })
    .click();
  await expect.poll(tableHeight).toBeGreaterThan(comfortableHeight + 50);
  await expect.poll(rowHeight).toBeLessThan(comfortableRow);
  expect(localStorage.getItem('nvmd-version-density')).toBe('compact');
  await takeScreenshot('versions-compact');
  // Visit both routes rather than testing two independent controls in isolation.
  await screen.getByRole('link', { name: 'Installed', exact: true }).click();
  await expect
    .element(screen.getByRole('button', { name: 'List density' }))
    .toHaveTextContent('Compact');
  await screen.getByRole('button', { name: 'List density' }).click();
  await screen
    .getByRole('menuitemradio', { name: 'Comfortable', exact: true })
    .click();
  await screen.getByRole('link', { name: 'Versions', exact: true }).click();
  await expect
    .element(screen.getByRole('button', { name: 'List density' }))
    .toHaveTextContent('Comfortable');
  await expect.poll(tableHeight).toBe(comfortableHeight);
  expect(localStorage.getItem('nvmd-version-density')).toBe('comfortable');
  await screen.getByRole('button', { name: 'List density' }).click();
  await screen
    .getByRole('menuitemradio', { name: 'Dense', exact: true })
    .click();
  await router.navigate('/installed');
  await expect
    .element(screen.getByRole('button', { name: 'List density' }))
    .toHaveTextContent('Dense');
  expect(
    document.querySelector('section[aria-label="Global environment"]'),
  ).toBeNull();
  expect(localStorage.getItem('nvmd-version-density')).toBe('dense');
  await screen.unmount();
  localStorage.removeItem('nvmd-version-density');
  window.dispatchEvent(new Event('nvmd-version-density-change'));
});

test('dense catalog is smaller than the original compact layout and fits narrow widths', async () => {
  const manyReleases = Array.from({ length: 80 }, (_, index) => ({
    ...release(index === 0 ? 'v27.0.0-alpha.0.0.0' : `v22.${index}.0`),
    lts: 'Jod',
    v8: '12.4.254.21-node.22',
  }));
  localStorage.removeItem('nvmd-version-density');
  const router = createMemoryRouter([
    {
      path: '/',
      loader: () => ['24.0.0', manyReleases, ['24.0.0']],
      Component: Versions,
      HydrateFallback: () => null,
    },
  ]);
  await page.viewport(1000, 720);
  const screen = await render(
    <TooltipProvider>
      <InstallTasksProvider>
        <div className='group/sidebar-wrapper h-screen bg-background p-6 text-foreground'>
          <aside data-slot='sidebar' data-state='collapsed' hidden />
          <RouterProvider router={router} />
        </div>
      </InstallTasksProvider>
    </TooltipProvider>,
  );
  await expect.element(screen.getByRole('table')).toBeVisible();
  const scrollArea = () =>
    document.querySelector('[data-slot="table-container"]')!.parentElement!;
  const comfortableTop = scrollArea().getBoundingClientRect().top;
  localStorage.setItem('nvmd-version-density', 'compact');
  window.dispatchEvent(new Event('nvmd-version-density-change'));
  await vi.waitFor(() => {
    expect(scrollArea().getBoundingClientRect().top).toBeLessThan(
      comfortableTop - 50,
    );
  });
  const compactTop = scrollArea().getBoundingClientRect().top;
  expect(
    document.querySelector('section[aria-label="Global environment"]'),
  ).not.toBeNull();
  expect(
    document.querySelector('[data-density="compact"] p')!.className,
  ).not.toContain('hidden');
  await screen.getByRole('button', { name: 'List density' }).click();
  await screen
    .getByRole('menuitemradio', { name: 'Dense', exact: true })
    .click();
  expect(localStorage.getItem('nvmd-version-density')).toBe('dense');
  await expect
    .element(
      screen.getByRole('heading', { name: 'Release catalog', exact: true }),
    )
    .not.toBeInTheDocument();
  expect(
    document.querySelector('section[aria-label="Global environment"]'),
  ).toBeNull();
  await vi.waitFor(() => {
    expect(scrollArea().getBoundingClientRect().top).toBeLessThan(
      compactTop - 30,
    );
  });
  await screen
    .getByRole('button', { name: 'Batch install', exact: true })
    .click();
  await expect
    .element(screen.getByRole('button', { name: 'List density' }))
    .toHaveTextContent('Dense');
  for (const width of [800, 720]) {
    await page.viewport(width, 720);
    await vi.waitFor(() => {
      expect(scrollArea().scrollWidth).toBeLessThanOrEqual(
        scrollArea().clientWidth + 1,
      );
      const rows = document.querySelectorAll('tbody tr');
      expect(rows[0].getBoundingClientRect().height).toBe(
        rows[1].getBoundingClientRect().height,
      );
      for (const cell of document.querySelectorAll(
        '[data-slot="table-cell"]',
      )) {
        expect(cell.scrollWidth).toBeLessThanOrEqual(cell.clientWidth + 1);
      }
    });
  }
  const sidebar = document.querySelector('[data-slot="sidebar"]')!;
  sidebar.setAttribute('data-state', 'expanded');
  await vi.waitFor(() => {
    expect(scrollArea().scrollWidth).toBeGreaterThan(scrollArea().clientWidth);
  });
  sidebar.setAttribute('data-state', 'collapsed');
  await vi.waitFor(() => {
    expect(scrollArea().scrollWidth).toBeLessThanOrEqual(
      scrollArea().clientWidth + 1,
    );
  });
  await takeScreenshot('nvmd-dense-catalog');
  await screen.unmount();
  localStorage.removeItem('nvmd-version-density');
  window.dispatchEvent(new Event('nvmd-version-density-change'));
});

for (const density of ['comfortable', 'compact', 'dense'] as const) {
  for (const route of ['versions', 'installed'] as const) {
    test(`${route} ${density} fits collapsed navigation and allows expanded scrolling`, async () => {
      const { Component: Installed } = await import('../installed');
      localStorage.setItem('nvmd-version-density', density);
      const router = createMemoryRouter([
        {
          path: '/',
          Component: route === 'versions' ? Versions : Installed,
          loader: () => [
            '24.0.0',
            [
              release('v27.0.0-alpha.0.0.0'),
              {
                ...release('v24.0.0'),
                lts: 'Krypton',
                v8: '12.4.254.21-node.22',
              },
            ],
            ['24.0.0'],
          ],
          HydrateFallback: () => null,
        },
      ]);
      const screen = await render(
        <TooltipProvider>
          <InstallTasksProvider>
            <div className='group/sidebar-wrapper h-screen p-6'>
              <aside data-slot='sidebar' data-state='collapsed' hidden />
              <RouterProvider router={router} />
            </div>
          </InstallTasksProvider>
        </TooltipProvider>,
      );
      try {
        await expect.element(screen.getByRole('table')).toBeVisible();
        const scrollArea = () =>
          document.querySelector('[data-slot="table-container"]')!
            .parentElement!;
        for (const width of [1000, 800, 720]) {
          await page.viewport(width, 720);
          await vi.waitFor(() => {
            expect(scrollArea().scrollWidth).toBeLessThanOrEqual(
              scrollArea().clientWidth + 1,
            );
            for (const cell of document.querySelectorAll(
              'tbody td, thead th',
            )) {
              expect(cell.scrollWidth).toBeLessThanOrEqual(
                cell.clientWidth + 1,
              );
            }
          });
        }
        await page.viewport(1600, 900);
        await vi.waitFor(() => {
          const labels = document.querySelectorAll('thead span[title]');
          expect(labels.length).toBeGreaterThan(0);
          for (const label of labels) {
            expect(label.scrollWidth).toBeLessThanOrEqual(
              label.clientWidth + 1,
            );
          }
        });
        await page.viewport(720, 720);
        document
          .querySelector('[data-slot="sidebar"]')!
          .setAttribute('data-state', 'expanded');
        await vi.waitFor(() =>
          expect(scrollArea().scrollWidth).toBeGreaterThan(
            scrollArea().clientWidth,
          ),
        );
      } finally {
        await screen.unmount();
        localStorage.removeItem('nvmd-version-density');
      }
    });
  }
}

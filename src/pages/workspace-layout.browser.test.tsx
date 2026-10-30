import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { expect, test, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { TooltipProvider } from '@/components/ui';
import '@/services/i18n';
import { Component as Projects } from './projects';
import { Component as Groups } from './groups';

vi.mock('@/app-context', () => ({
  useAppContext: () => ({ settings: { directory: '/tmp/nvmd' } }),
}));
vi.mock('@/services/api', async (original) => ({
  ...(await original<typeof import('@/services/api')>()),
  getCurrent: () => ({ listen: async () => () => {} }),
}));
vi.mock('@/services/cmds', async (original) => ({
  ...(await original<typeof import('@/services/cmds')>()),
  installedList: async () => ['24.22.1'],
}));
const projects = [
  {
    name: 'A project with a long name',
    path: '/tmp/a/very/long/project/path',
    version: '24.22.1',
    active: true,
    createAt: '',
    updateAt: '',
  },
];
const groups = [
  {
    name: 'Development group',
    desc: 'A long group description',
    version: '24.22.1',
    projects: [projects[0].path],
  },
];
for (const [name, Component] of [
  ['Projects', Projects],
  ['Groups', Groups],
] as const) {
  test(`${name} dense table fits a collapsed sidebar and can scroll when expanded`, async () => {
    localStorage.setItem('nvmd-version-density', 'dense');
    const router = createMemoryRouter([
      {
        path: '/',
        Component,
        loader: () => [projects, groups, ['24.22.1']],
        HydrateFallback: () => null,
      },
    ]);
    const screen = await render(
      <TooltipProvider>
        <div className='group/sidebar-wrapper h-screen p-6'>
          <aside data-slot='sidebar' data-state='collapsed' hidden />
          <RouterProvider router={router} />
        </div>
      </TooltipProvider>,
    );
    try {
      await expect.element(screen.getByRole('table')).toBeVisible();
      const scrollArea = () =>
        document.querySelector('[data-slot="table-container"]')!.parentElement!;
      for (const width of [1000, 800]) {
        await page.viewport(width, 720);
        await vi.waitFor(() => {
          expect(scrollArea().scrollWidth).toBeLessThanOrEqual(
            scrollArea().clientWidth + 1,
          );
          for (const cell of document.querySelectorAll('tbody td')) {
            expect(cell.scrollWidth).toBeLessThanOrEqual(cell.clientWidth + 1);
          }
        });
      }
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

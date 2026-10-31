import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { expect, test } from 'vitest';
import '@/services/i18n';
import { WorkspaceOverview } from './workspace-layout';
import { DataTable } from './ui/data-table';
import { DataDndTable } from './ui/data-dnd-table';
import type { VersionDensity } from '@/hooks/use-version-density';

test('workspace summary and draggable rows use distinct density sizes', async () => {
  await page.viewport(1100, 800);
  const heights: number[] = [];
  const summaries: number[] = [];
  for (const density of [
    'comfortable',
    'compact',
    'dense',
  ] as VersionDensity[]) {
    const screen = await render(
      <div className='flex h-screen flex-col gap-2 p-6'>
        {density !== 'dense' && (
          <WorkspaceOverview
            compact={density === 'compact'}
            mode='projects'
            projectCount={3}
            groupCount={2}
            installedCount={6}
          />
        )}
        <DataDndTable
          density={density}
          columns={[{ accessorKey: 'name', header: 'Name' }]}
          data={[{ name: 'Project' }]}
          items={['project']}
          getRowId={() => 'project'}
          reorderRow={() => {}}
        />
        {density === 'dense' && (
          <DataTable
            density={density}
            columns={[{ accessorKey: 'name', header: 'Name' }]}
            data={[{ name: 'Version' }]}
          />
        )}
      </div>,
    );
    await expect
      .element(screen.getByRole('button', { name: 'Drag to reorder' }))
      .toBeVisible();
    heights.push(
      document.querySelector('tbody tr')!.getBoundingClientRect().height,
    );
    summaries.push(
      document.querySelector('section')?.getBoundingClientRect().height ?? 0,
    );
    if (density === 'dense') {
      const headers = document.querySelectorAll('thead');
      expect(headers.length).toBe(2);
      expect(headers[0].getBoundingClientRect().height).toBe(
        headers[1].getBoundingClientRect().height,
      );
    }
    await screen.unmount();
  }
  expect(heights[0]).toBeGreaterThan(heights[1]);
  expect(heights[1]).toBeGreaterThan(heights[2]);
  expect(summaries[0]).toBeGreaterThan(summaries[1]);
  expect(summaries[1]).toBeGreaterThan(summaries[2]);
});

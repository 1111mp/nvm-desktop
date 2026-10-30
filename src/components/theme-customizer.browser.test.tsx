import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { expect, test, vi } from 'vitest';
import '@/services/i18n';
import { ThemeCustomizer } from './theme-customizer';

vi.mock('@/app-context', () => ({
  useAppContext: () => ({
    color: { baseColor: 'neutral', theme: '', radius: '' },
    updateColor: vi.fn(),
  }),
}));

for (const [width, height, fontSize] of [
  [1000, 720, 16],
  [1440, 900, 16],
  [1280, 900, 20],
  [660, 480, 16],
]) {
  test(`theme picker fits ${width}x${height} at ${fontSize}px root size`, async () => {
    await page.viewport(width, height);
    document.documentElement.style.fontSize = `${fontSize}px`;
    const screen = await render(
      <div style={{ position: 'fixed', left: 16, bottom: 16 }}>
        <ThemeCustomizer />
      </div>,
    );
    try {
      await screen.getByRole('button', { name: 'Theme', exact: true }).click();
      await expect
        .element(screen.getByRole('button', { name: 'Claude', exact: true }))
        .toBeVisible();
      const popup = document.querySelector('[data-slot="popover-content"]')!;
      const content = popup.lastElementChild!;
      await vi.waitFor(() => {
        const bounds = popup.getBoundingClientRect();
        expect(bounds.top).toBeGreaterThanOrEqual(0);
        expect(bounds.bottom).toBeLessThanOrEqual(height);
        expect(bounds.left).toBeGreaterThanOrEqual(0);
        expect(bounds.right).toBeLessThanOrEqual(width);
        expect(content.scrollWidth).toBeLessThanOrEqual(
          content.clientWidth + 1,
        );
        if (height >= 720)
          expect(content.scrollHeight).toBeLessThanOrEqual(
            content.clientHeight + 1,
          );
        else expect(getComputedStyle(content).overflowY).toBe('auto');
      });
    } finally {
      await screen.unmount();
      document.documentElement.style.removeProperty('font-size');
    }
  });
}

import { render } from 'vitest-browser-react';
import { expect, test, vi } from 'vitest';
import { CodeSnippet } from './code-snippet';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

test('a command can be copied in a real browser', async () => {
  const screen = await render(<CodeSnippet>nvmd use 22.0.0</CodeSnippet>);
  const copy = screen.getByRole('button', { name: 'Code-Copy' });
  await copy.click();
  await expect
    .element(screen.getByRole('button', { name: 'Code-Copied' }))
    .toBeVisible();
});

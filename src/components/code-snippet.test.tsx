import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { CodeSnippet } from './code-snippet';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

test('copying a command writes its full text and confirms completion', async () => {
  const user = userEvent.setup();
  render(<CodeSnippet>nvmd use 22.0.0</CodeSnippet>);
  await user.click(screen.getByRole('button', { name: 'Code-Copy' }));
  expect(await navigator.clipboard.readText()).toBe('nvmd use 22.0.0');
  expect(
    screen.getByRole('button', { name: 'Code-Copied' }),
  ).toBeInTheDocument();
});

test('clipboard failures leave the copy action available for retry', async () => {
  const user = userEvent.setup();
  vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(
    new Error('denied'),
  );
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  render(<CodeSnippet>nvmd use 22.0.0</CodeSnippet>);
  await user.click(screen.getByRole('button', { name: 'Code-Copy' }));
  expect(screen.getByRole('button', { name: 'Code-Copy' })).toBeInTheDocument();
});

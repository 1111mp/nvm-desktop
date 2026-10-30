import { render } from 'vitest-browser-react';
import { expect, test } from 'vitest';

test('theme palettes keep system typography and text dimensions stable', async () => {
  const themes = [
    'blue',
    'claude',
    'clean_slate',
    'corporate',
    'marvel',
    'nature',
    'pastel_dreams',
    'perplexity',
    'summer',
    'vs_code',
  ];
  const screen = await render(
    <div>
      <span data-testid='label'>Versions 版本管理</span>
      <span data-testid='version' className='font-mono'>
        v24.22.1 14.6.202.34
      </span>
    </div>,
  );
  const nodes = [
    screen.getByTestId('label').element(),
    screen.getByTestId('version').element(),
  ];
  const metrics = () =>
    nodes.map((node) => ({
      font: getComputedStyle(node).fontFamily,
      width: node.getBoundingClientRect().width,
      height: node.getBoundingClientRect().height,
    }));
  const baseline = metrics();
  try {
    for (const dark of [false, true]) {
      document.documentElement.classList.toggle('dark', dark);
      for (const theme of themes) {
        document.body.classList.add(`theme-${theme}`);
        try {
          expect(metrics()).toEqual(baseline);
        } finally {
          document.body.classList.remove(`theme-${theme}`);
        }
      }
    }
  } finally {
    document.documentElement.classList.remove('dark');
    await screen.unmount();
  }
});

import { browser, expect } from '@wdio/globals';

describe('Desktop smoke tests', () => {
  before(async () => {
    // WebView storage survives process lifetimes even with fresh Rust fixtures.
    await browser.execute(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await browser.refresh();
  });
  it('reads isolated settings through the real Rust backend', async () => {
    await browser.waitUntil(
      async () => {
        try {
          const settings = await browser.tauri.execute(({ core }) =>
            core.invoke('read_settings'),
          );
          return !!settings;
        } catch {
          return false;
        }
      },
      { timeoutMsg: 'The Rust backend did not finish initializing' },
    );
    const settings = await browser.tauri.execute(({ core }) =>
      core.invoke('read_settings'),
    );
    expect(settings).toMatchObject({
      locale: 'en',
      theme: 'light',
      closer: 'close',
    });
    const projects = await browser.tauri.execute(({ core }) =>
      core.invoke('project_list', { fetch: true }),
    );
    expect(projects).toEqual([]);
  });

  it('renders the onboarding dialog and remembers dismissal after reload', async () => {
    const dialog = browser.$('[role="dialog"]');
    await expect(dialog).toBeDisplayed();
    await dialog.$('button=Skip for now').click();
    await expect(dialog).not.toExist();
    await browser.refresh();
    await expect(browser.$('a[href="/versions"]')).toBeDisplayed();
    await expect(browser.$('[role="dialog"]')).not.toExist();
  });

  it('mocks IPC through the test bridge and restores the real handler', async () => {
    const mock = await browser.tauri.mock('read_settings');
    try {
      await mock.mockReturnValue({ locale: 'bridge-probe' });
      const result = await browser.tauri.execute(({ core }) =>
        core.invoke('read_settings'),
      );
      expect(result).toEqual({ locale: 'bridge-probe' });
    } finally {
      await mock.mockRestore();
    }
    const settings = await browser.tauri.execute(({ core }) =>
      core.invoke('read_settings'),
    );
    expect(settings).toMatchObject({ locale: 'en' });
  });

  it('captures a screenshot from the native WebView', async () => {
    const screenshot = await browser.takeScreenshot();
    expect(Buffer.from(screenshot, 'base64').subarray(0, 8)).toEqual(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    );
  });
});

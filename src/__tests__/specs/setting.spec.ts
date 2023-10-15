import { browser, expect } from '@wdio/globals';
import { setupBrowser, WebdriverIOQueries } from '@testing-library/webdriverio';

describe('Module Setting', () => {
  let screen: WebdriverIOQueries;

  before(() => {
    screen = setupBrowser(browser);
  });

  // Cover a few WebdriverIO expect matchers -  https://webdriver.io/docs/api/expect-webdriverio

  describe('Language', async () => {
    it('should be set & update', async () => {
      const defaultLocale = await (
          await browser.$('.ant-select-selection-item')
        ).getText(),
        selectLocale = defaultLocale === 'English' ? '简体中文' : 'English',
        index = selectLocale === 'English' ? 1 : 0;

      const exist = await browser.waitUntil(
        async function () {
          return await browser
            .$$('.ant-select-item-option')
            [index].$('.ant-select-item-option-content')
            .getText();
        },
        {
          timeout: 5000,
          timeoutMsg: 'expected text to be different after 5s',
        },
      );

      expect(exist).toHaveText(selectLocale);

      await (await browser.$$('.ant-select-item-option'))[index].click();

      await expect(await browser.$('.ant-select-selection-item')).toHaveText(
        selectLocale,
      );

      await (await screen.getByTestId('setting-submit')).click();
    });
  });

  describe('Theme', () => {
    it('should be set & update', async () => {});
  });
});

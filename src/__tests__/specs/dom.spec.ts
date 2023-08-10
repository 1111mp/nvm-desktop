import { browser } from 'wdio-electron-service';
import { setupBrowser, WebdriverIOQueries } from '@testing-library/webdriverio';

describe('application loading', () => {
  let screen: WebdriverIOQueries;

  before(() => {
    screen = setupBrowser(browser);
  });

  // Cover a few WebdriverIO expect matchers -  https://webdriver.io/docs/api/expect-webdriverio

  describe('DOM', () => {
    it('should determine when an element is in the document', async () => {});
  });
});

import { browser, expect } from '@wdio/globals';
import { productName, version } from '../../../package.json';

describe('Electron APIs', () => {
  describe('app', () => {
    it('should retrieve app metadata through the electron API', async () => {
      const appName = await browser.electron.app('getName');
      expect(appName).toEqual(productName);
      const appVersion = await browser.electron.app('getVersion');
      expect(appVersion).toEqual(version);
    });
  });

  describe('IPC Renderer', () => {
    describe('get-system-theme', () => {
      it('should return the value of system theme', async () => {
        const theme = await browser.electron.api('get-system-theme');

        expect(theme).toHaveText(['light', 'dark']);
      });
    });

    describe('setting-data-get', () => {
      it('should return the value of setting', async () => {
        const setting = await browser.electron.api('setting-data-get');

        expect(setting).toBeDefined();
        expect(setting).toHaveProperty('locale');
        expect(setting).toHaveProperty('mirror');
        expect(setting).toHaveProperty('theme');
      });
    });
  });
});

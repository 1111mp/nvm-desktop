import { browser } from 'wdio-electron-service';
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
});

import { platform } from 'node:process';
import { pathExists } from 'fs-extra';
import { browser } from 'wdio-electron-service';

describe('Nvmd', () => {
  if (platform === 'darwin') {
    describe('nvmd.shell', () => {
      it('should be existed', async () => {
        const HOMEDIR = (await browser.electron.app(
          'getPath',
          'home',
        )) as string;
        const file = `${HOMEDIR}/.nvmd/nvmd.sh`;

        expect(await pathExists(file)).toBeTruthy();
      });
    });
  }
});

import { join } from 'node:path';
import { platform } from 'node:process';
import { pathExists } from 'fs-extra';
import { browser, expect } from '@wdio/globals';

describe('nvmd', () => {
  it('file should be existed', async () => {
    const HOMEDIR = (await browser.electron.app('getPath', 'home')) as string;
    const nvmdPath = join(
      HOMEDIR,
      '.nvmd',
      'bin',
      platform === 'win32' ? 'nvmd.exe' : 'nvmd',
    );

    expect(await pathExists(nvmdPath)).toBeTruthy();
  });
});

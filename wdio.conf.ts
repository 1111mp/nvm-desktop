import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { TauriServiceOptions } from '@wdio/tauri-service';
import type {} from '@wdio/types';

const artifacts = fileURLToPath(
  new URL('./test-results/desktop/', import.meta.url),
);
if (!process.env.NVMD_E2E_DATA_DIR || !process.env.NVMD_E2E_BINARY) {
  throw new Error('Run pnpm test:e2e to use an isolated workspace.');
}

export const config: WebdriverIO.Config = {
  tsConfigPath: './tsconfig.e2e.json',
  runner: 'local',
  specs: ['./test/e2e/**/*.spec.ts'],
  maxInstances: 1,
  capabilities: [{ browserName: 'tauri' }],
  services: [
    [
      '@wdio/tauri-service',
      {
        appBinaryPath: process.env.NVMD_E2E_BINARY,
        driverProvider: 'embedded',
        captureBackendLogs: true,
        captureFrontendLogs: true,
        env: {
          NVMD_E2E_DATA_DIR: process.env.NVMD_E2E_DATA_DIR,
        },
      } satisfies TauriServiceOptions,
    ],
  ],
  framework: 'mocha',
  reporters: ['spec'],
  logLevel: 'info',
  outputDir: artifacts,
  waitforTimeout: 15000,
  connectionRetryCount: 0,
  mochaOpts: { timeout: 30000 },
  async onComplete() {
    if (process.env.KEEP_TEST_ARTIFACTS !== '1') {
      await rm(artifacts, { recursive: true, force: true });
    }
  },
  async afterTest(test, _context, { passed }) {
    if (passed) return;
    await mkdir(artifacts, { recursive: true });
    const name = `${Date.now()}-${test.title.replace(/[^a-z0-9]+/gi, '-')}`;
    const { browser } = await import('@wdio/globals');
    // Collect independently so a broken WebView cannot hide the original failure.
    const diagnostics = await Promise.allSettled([
      browser.saveScreenshot(join(artifacts, `${name}.png`)),
      browser
        .getPageSource()
        .then((source) => writeFile(join(artifacts, `${name}.html`), source)),
      writeFile(
        join(artifacts, `${name}.json`),
        JSON.stringify(
          {
            test: test.title,
            workspace: process.env.NVMD_E2E_DATA_DIR,
          },
          null,
          2,
        ),
      ),
    ]);
    for (const diagnostic of diagnostics) {
      if (diagnostic.status === 'rejected') console.error(diagnostic.reason);
    }
  },
};

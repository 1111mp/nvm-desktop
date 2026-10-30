import { resolve } from 'node:path';
import { rm } from 'node:fs/promises';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

// Isolate concurrent test commands; one run must not delete another run's output.
const artifacts = resolve(
  import.meta.dirname,
  'test-results/vitest',
  String(process.pid),
);

// Match Tauri's engine family; Playwright does not exercise the native WebView.
const browser = process.platform === 'win32' ? 'chromium' : 'webkit';

export default defineConfig({
  resolve: { alias: { '@': resolve(import.meta.dirname, 'src') } },
  define: {
    TEST_SCREENSHOT_DIR: JSON.stringify(resolve(artifacts, 'screenshots')),
    OS_ARCH: JSON.stringify(process.arch),
    OS_PLATFORM: JSON.stringify(process.platform),
  },
  test: {
    restoreMocks: true,
    attachmentsDir: resolve(artifacts, 'attachments'),
    reporters: [
      'default',
      {
        async onTestRunEnd() {
          if (process.env.KEEP_TEST_ARTIFACTS !== '1') {
            await rm(artifacts, { recursive: true, force: true });
          }
        },
      },
    ],
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
          exclude: ['src/**/*.tauri.test.ts', 'src/**/*.browser.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'component',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
          exclude: ['src/**/*.browser.test.tsx'],
          setupFiles: ['./src/test/component-setup.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'tauri',
          environment: 'jsdom',
          include: ['src/**/*.tauri.test.ts'],
          setupFiles: ['./src/test/tauri-setup.ts'],
        },
      },
      {
        extends: true,
        plugins: [react(), tailwindcss()],
        // Bulk-install tests load the full version table. Discover dependencies
        // before the browser starts so Vite cannot reload a running test.
        optimizeDeps: {
          entries: ['src/**/*.browser.test.{ts,tsx}'],
          include: [
            'react-router',
            'i18next',
            'dayjs/plugin/localizedFormat',
            '@tauri-apps/plugin-dialog',
          ],
        },
        test: {
          name: 'browser',
          include: ['src/**/*.browser.test.{ts,tsx}'],
          setupFiles: ['./src/test/browser-setup.ts'],
          browser: {
            enabled: true,
            headless: true,
            screenshotDirectory: resolve(artifacts, 'screenshots'),
            provider: playwright(),
            instances: [{ browser }],
          },
        },
      },
    ],
  },
});

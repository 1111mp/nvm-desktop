import { page } from 'vitest/browser';

// Injected by Vitest so paths never resolve relative to a source file.
declare const TEST_SCREENSHOT_DIR: string;

export function takeScreenshot(name: string) {
  return page.screenshot({ path: `${TEST_SCREENSHOT_DIR}/${name}.png` });
}

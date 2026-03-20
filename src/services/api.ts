import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

import { getSettings } from './cmds';
import { SystemTheme } from '@/types';

/**
 * @description Get an instance of `Webview` for the current webview window.
 *
 * @since tauri 2.0.0
 */
export function getCurrent() {
  return getCurrentWebviewWindow();
}

/**
 * @description Closes the webview.
 * @return {Promise<void>} A promise indicating the success or failure of the operation.
 */
export function windowClose() {
  return getCurrent().close();
}

/**
 * @description Minimizes the window.
 *
 * @returns {Promise<void>} A promise indicating the success or failure of the operation.
 */
export function windowMinimize() {
  return getCurrent().minimize();
}

export function setWindowFocus() {
  return getCurrent().setFocus();
}

/**
 * @description Gets the window's current theme.
 *
 * #### Platform-specific
 *
 * - **macOS:** Theme was introduced on macOS 10.14. Returns `light` on macOS 10.13 and below.
 *
 * @returns {Promise<Theme>} The window theme: `light` or `dark`.
 */
export function getSystemCurrentTheme() {
  return getCurrent().theme() as Promise<SystemTheme>;
}

/**
 * @description Retrieves initial application data (settings and system theme).
 *
 * - On first load (app startup), it reads data injected via Tauri's initialization_script
 *   to avoid extra IPC calls and prevent UI flicker.
 * - On subsequent reloads, it fetches fresh data via invoke to ensure data consistency.
 *
 * @returns {Promise<[Nvmd.Setting, SystemTheme]>}
 */
export async function getAppInitialData(): Promise<
  [Nvmd.Setting, SystemTheme]
> {
  /**
   * Indicates whether initialization data has already been used
   * within the current WebView lifecycle.
   *
   * sessionStorage behavior:
   * - Persists across page reloads (F5)
   * - Cleared when the window/app is closed
   */
  const isInitial = sessionStorage.getItem('__NVMD_INITIAL__');
  const hasInitData =
    window.__NVMD_INITIAL_SETTINGS__ && window.__NVMD_INITIAL_THEME__;
  // First load (app just started)
  if (isInitial === 'no' && hasInitData) {
    sessionStorage.setItem('__NVMD_INITIAL__', 'yes');
    return [window.__NVMD_INITIAL_SETTINGS__, window.__NVMD_INITIAL_THEME__];
  }

  // Page reload (or subsequent loads)
  const data = await Promise.all([getSettings(), getSystemCurrentTheme()]);
  return data;
}

import { getCurrent as getCurrentWindow } from '@tauri-apps/api/webviewWindow';

import { SystemTheme } from '@/types';

/**
 * @description Get an instance of `Webview` for the current webview window.
 *
 * @since tauri 2.0.0
 */
export function getCurrent() {
	return getCurrentWindow();
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

import { invoke } from '@tauri-apps/api/core';

export async function getSettings() {
  return invoke<Nvmd.Setting>('read_settings');
}

export async function updateSettings(settings: Nvmd.Setting) {
  return invoke<void>('update_settings', { settings });
}

export function vCurrent(fetch: boolean = false) {
  return invoke<string>('current', { fetch });
}

export function vSetCurrent(version: string) {
  return invoke<void>('set_current', { version });
}

export function versionList(fetch: boolean = false) {
  return invoke<Nvmd.Versions>('version_list', { fetch });
}

export function installedList(fetch: boolean = false) {
  return invoke<Array<string>>('installed_list', { fetch });
}

export function installNode(version: string, arch?: string) {
  return invoke<string>('install_node', { version, arch });
}

/**
 * @description	uninstall node
 * @param {string} version version number
 * @param {boolean} current whether the version to be uninstalled is the currently used version
 * @returns {Promise<void>} Promise<void>
 */
export function uninstallNode(version: string, current: boolean = false) {
  return invoke<void>('uninstall_node', { version, current });
}

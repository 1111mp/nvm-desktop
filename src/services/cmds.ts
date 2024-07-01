import { invoke } from '@tauri-apps/api/core';

export async function getSettings() {
	return invoke<Nvmd.Setting>('read_settings');
}

export function vCurrent() {
	return invoke<string>('current');
}

export function versionList(fetch: boolean = false) {
	return invoke<Nvmd.Versions>('version_list', { fetch });
}

export function installedList(fetch: boolean = false) {
	return invoke<Array<string>>('installed_list', { fetch });
}

export function installNode() {
	return invoke('install_node', { version: '22.3.0' });
}

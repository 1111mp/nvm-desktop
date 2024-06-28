import { invoke } from '@tauri-apps/api/core';

export async function getSettings() {
	return invoke<Nvmd.Setting>('read_settings');
}

export function current() {
	return invoke<string>('current');
}

export function version_list() {
	return invoke<Nvmd.Versions>('version_list');
}

export function installed_list() {
	return invoke<Array<string>>('installed_list');
}

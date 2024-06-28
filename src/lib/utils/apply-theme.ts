import semver from 'semver';
import { SystemTheme } from '@/types';

export function applyTheme(theme: SystemTheme) {
	const root = window.document.documentElement;

	if (root.classList.contains(theme)) return;

	root.classList.remove('light', 'dark');
	root.classList.add(theme);
}

export function checkSupportive(files: string[]): boolean {
	const name =
		OS_PLATFORM === 'darwin'
			? `osx-${OS_ARCH}`
			: OS_PLATFORM === 'win32'
			? `win-${OS_ARCH}`
			: `${OS_PLATFORM}-${OS_ARCH}`;

	return !!files.find((file) => file.includes(name));
}

export function compareVersion(version1: string, version2: string): number {
	version1 = version1.slice(1);
	version2 = version2.slice(1);

	return semver.gt(version2, version1) ? -1 : 1;
}

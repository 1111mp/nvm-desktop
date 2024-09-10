import { Closer, Themes } from 'types';
// import type { UpdateInfo as ElectronUpdateInfo } from "electron-updater";

type Platform =
	| 'aix'
	| 'android'
	| 'darwin'
	| 'freebsd'
	| 'haiku'
	| 'linux'
	| 'openbsd'
	| 'sunos'
	| 'win32'
	| 'cygwin'
	| 'netbsd';
type Architecture =
	| 'arm'
	| 'arm64'
	| 'ia32'
	| 'loong64'
	| 'mips'
	| 'mipsel'
	| 'ppc'
	| 'ppc64'
	| 'riscv64'
	| 's390'
	| 's390x'
	| 'x64';

declare global {
	/**
	 * defines in `vite.config.ts`
	 */
	declare const OS_ARCH: Architecture;
	declare const OS_PLATFORM: Platform;

	namespace Nvmd {
		interface Version {
			version: string;
			npm: string;
			lts: string | false;
			date: string;
			v8: string;
			files: string[];
		}

		type Versions = Array<Version>;

		interface ProgressData {
			source: 'download' | 'unzip';
			transferred: number;
			total: number;
		}

		interface Proxy {
			enabled: boolean;
			ip?: string;
			port?: string;
		}

		interface Setting {
			closer: Closer;
			directory: string;
			enable_silent_start?: boolean;
			locale: string;
			mirror: string;
			proxy?: Proxy;
			no_proxy?: boolean;
			theme: Themes;
		}

		// type UpdateInfo = ElectronUpdateInfo | "update-not-available";

		interface Project {
			name: string;
			path: string;
			version?: string;
			active: boolean;
			createAt: string;
			updateAt: string;
		}

		interface PInfo {
			path: string;
			version?: string;
		}

		interface Group {
			name: string;
			desc?: string;
			version: string;
			projects: string[];
		}

		interface ConfigrationExport {
			color?: string;
			mirrors?: string;
			projects?: boolean;
			setting?: boolean;
		}

		interface ConfigrationImport {
			color?: string;
			mirrors?: string;
			setting?: Setting;
		}
	}
}

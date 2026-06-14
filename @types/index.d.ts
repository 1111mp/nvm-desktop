import { Closer, Themes, SystemTheme } from '@/types';

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

  interface Window {
    __NVMD_INITIAL_SETTINGS__: Nvmd.Setting;
    __NVMD_INITIAL_THEME__: SystemTheme;
  }

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
      enabled?: boolean;
      ip?: string;
      port?: string;
    }

    interface Setting {
      closer: Closer;
      coder: string;
      directory: string;
      enable_silent_start?: boolean;
      locale: string;
      mirror: string;
      proxy?: Proxy;
      no_proxy?: boolean;
      theme: Themes;
      node_version_file?: string;
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

    interface ConfigurationExport {
      baseColor?: string;
      color?: string;
      radius?: string;
      mirrors?: string;
      projects?: boolean;
      setting?: boolean;
    }

    interface ConfigurationImport {
      baseColor?: string;
      color?: string;
      radius?: string;
      mirrors?: string;
      setting?: Setting;
    }
  }
}

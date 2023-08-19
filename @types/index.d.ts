import { Themes } from 'types';
import type { UpdateInfo as ElectronUpdateInfo } from 'electron-updater';

declare global {
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
      percent: number;
      transferred: number;
      total: number;
    }

    interface Setting {
      locale: string;
      theme: Themes;
      mirror: string;
    }

    type UpdateInfo = ElectronUpdateInfo | 'update-not-available';

    interface Project {
      name: string;
      path: string;
      version?: string;
      active: boolean;
      createAt: string;
      updateAt: string;
    }
  }
}

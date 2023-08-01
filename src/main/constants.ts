import { app } from 'electron';

export const HOME = app.getPath('home');

export const APPDIR = `${HOME}/.nvmd`,
  INSTALL_DIR = `${APPDIR}/versions`,
  VERSIONS_FILENAME = `${APPDIR}/versions.json`,
  SETTING_JSONFILE = `${APPDIR}/setting.json`,
  NVMD_SHELL_FILENAME = 'nvmd.sh';

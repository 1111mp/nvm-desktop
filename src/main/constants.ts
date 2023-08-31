import { app } from 'electron';

export const HOME = app.getPath('home');

export const APPDIR = `${HOME}/.nvmd`,
  BIN_DIR = `${APPDIR}/bin`,
  INSTALL_DIR = `${APPDIR}/versions`,
  VERSIONS_FILENAME = `${APPDIR}/versions.json`,
  SETTING_JSONFILE = `${APPDIR}/setting.json`,
  PROJECTS_JSONFILE = `${APPDIR}/projects.json`,
  SHELL_VERSION_FILE = `${APPDIR}/migration`,
  NVMD_COMMAND_FILENAME = 'nvmd',
  NVMDRC_NAME = '.nvmdrc';

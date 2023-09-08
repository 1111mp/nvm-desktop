import { join } from 'node:path';
import { app } from 'electron';

export const HOME = app.getPath('home');

export const APPDIR = join(HOME, '.nvmd'),
  BIN_DIR = join(APPDIR, 'bin'),
  INSTALL_DIR = join(APPDIR, 'versions'),
  VERSIONS_FILENAME = join(APPDIR, 'versions.json'),
  SETTING_JSONFILE = join(APPDIR, 'setting.json'),
  PROJECTS_JSONFILE = join(APPDIR, 'projects.json'),
  MIRRATION_FILE = join(APPDIR, 'migration'),
  NVMDRC_NAME = '.nvmdrc';

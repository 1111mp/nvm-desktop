import { pathExists, readJson, writeJson } from 'fs-extra';
import { app } from 'electron';
import { INSTALL_DIR, SETTING_JSONFILE } from '../constants';
import { Closer, Themes } from '../../types';

export async function getSetting(): Promise<Nvmd.Setting> {
  if (!(await pathExists(SETTING_JSONFILE)))
    return {
      locale: app.getLocale().startsWith('en') ? 'en' : 'zh-CN',
      theme: Themes.System,
      closer: Closer.Minimize,
      directory: INSTALL_DIR,
      mirror: 'https://nodejs.org/dist',
    };

  const setting = await readJson(SETTING_JSONFILE, { throws: false });
  if (!setting.directory) setting.directory = INSTALL_DIR;
  if (!setting.closer) setting.closer = Closer.Minimize;
  return (
    setting || {
      locale: app.getLocale().startsWith('en') ? 'en' : 'zh-CN',
      theme: Themes.System,
      closer: Closer.Minimize,
      directory: INSTALL_DIR,
      mirror: 'https://nodejs.org/dist',
    }
  );
}

export async function setSetting(setting: Nvmd.Setting): Promise<void> {
  try {
    await writeJson(SETTING_JSONFILE, setting);
  } catch (err) {}
  return;
}

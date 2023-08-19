import { pathExists, readJson, writeJson } from 'fs-extra';
import { app } from 'electron';
import { SETTING_JSONFILE } from '../constants';
import { Themes } from '../../types';

export async function getSetting(): Promise<Nvmd.Setting> {
  if (!(await pathExists(SETTING_JSONFILE)))
    return {
      locale: app.getLocale().startsWith('en') ? 'en' : 'zh-CN',
      theme: Themes.System,
      mirror: 'https://nodejs.org/dist',
    };

  const setting = await readJson(SETTING_JSONFILE, { throws: false });
  return (
    setting || {
      locale: app.getLocale().startsWith('en') ? 'en' : 'zh-CN',
      theme: Themes.System,
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

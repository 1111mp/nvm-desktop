import { readJSON, writeJSON } from 'fs-extra';
import { app } from 'electron';
import { SETTING_JSONFILE } from '../constants';
import { Themes } from '../../types';

export async function getSetting(): Promise<Nvmd.Setting> {
  console.log(app.getLocale());
  try {
    const setting = await readJSON(SETTING_JSONFILE);
    return setting;
  } catch (err) {
    return {
      locale: app.getLocale().startsWith('en') ? 'en' : 'zh-CN',
      theme: Themes.System,
      mirror: 'https://nodejs.org/dist',
    };
  }
}

export async function setSetting(setting: Nvmd.Setting): Promise<void> {
  try {
    await writeJSON(SETTING_JSONFILE, setting);
  } catch (err) {}
  return;
}

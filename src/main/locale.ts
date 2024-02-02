import { join } from "path";
import { readFileSync } from "fs-extra";
import { app } from "electron";
import { merge } from "lodash";
import { setup } from "./i18n";
import { __dirname } from "./utils/dirname";

function normalizeLocaleName(locale: string) {
  if (/^en-/.test(locale)) {
    return "en";
  }

  return locale;
}

function getLocaleMessages(locale: string): I18n.Message {
  const onDiskLocale = locale.replace("-", "_");

  const targetFile = app.isPackaged
    ? join(process.resourcesPath, "_locales", onDiskLocale, "messages.json")
    : join(__dirname, "../..", "_locales", onDiskLocale, "messages.json");

  return JSON.parse(readFileSync(targetFile, "utf-8"));
}

export default function loadLocale({ appLocale }: { appLocale?: string } = {}): I18n.Locale {
  if (!appLocale) {
    throw new TypeError("`appLocale` is required");
  }

  const english = getLocaleMessages("en");

  // Load locale - if we can't load messages for the current locale, we
  // default to 'en'
  //
  // possible locales:
  // https://github.com/electron/electron/blob/master/docs/api/locales.md
  let localeName = normalizeLocaleName(appLocale);
  let messages;

  try {
    messages = getLocaleMessages(localeName);

    // We start with english, then overwrite that with anything present in locale
    messages = merge(english, messages);
  } catch (err) {
    console.log(`Problem loading messages for locale ${localeName} ${err.stack}`);
    console.log("Falling back to en locale");

    localeName = "en";
    messages = english;
  }

  const i18n = setup(appLocale, messages);

  return {
    i18n,
    locale: localeName,
    messages
  };
}

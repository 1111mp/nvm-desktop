import './App.scss';

import { useEffect, useReducer, useMemo, useCallback } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { AppContext, type I18nFn } from './appContext';
import { App as AntdApp, ConfigProvider, theme as antdTheme } from 'antd';
import en from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';

import { applyTheme } from './util';
import { Themes } from 'types';

type StateType = {
  locale: string;
  theme: Themes; // from setting
  sysTheme: Themes; // system real theme
  mirror: string;
  messages: I18n.Message;
};

enum Actions {
  ThemeChanged = 'THEME_CHANGED',
  UpdateSetting = 'UPDATE_SETTING',
}

type StateAction = {
  type: Actions;
  payload: Partial<StateType>;
};

export default function App() {
  // const storageTheme = (localStorage.getItem('nvmd-theme') ||
  //   Themes.System) as Themes;

  const { locale, theme, mirror, localeMessages } =
    window.Context.getSettingData();

  const [state, dispatch] = useReducer(
    (state: StateType, action: StateAction) => {
      switch (action.type) {
        case Actions.ThemeChanged: {
          return { ...state, ...action.payload };
        }
        case Actions.UpdateSetting: {
          return { ...state, ...action.payload };
        }
        default:
          return state;
      }
    },
    {
      locale,
      theme: theme,
      sysTheme: window.Context.getSystemTheme() as Themes,
      mirror,
      messages: localeMessages,
    },
  );

  useEffect(() => {
    applyTheme(
      theme === Themes.System
        ? (window.Context.getSystemTheme() as Themes)
        : theme,
    );
  }, []);

  // system theme
  useEffect(() => {
    window.Context.onRegistThemeCallback((systemTheme) => {
      // Themes.Light or Themes.Dark
      state.theme === Themes.System && applyTheme(systemTheme as Themes);
      dispatch({
        type: Actions.ThemeChanged,
        payload: { sysTheme: systemTheme as Themes },
      });
    });
  }, [state.theme]);

  // update setting
  const onUpdateSetting = useMemo(
    () => async (setting: Nvmd.Setting) => {
      await window.Context.updateSettingData(setting);

      if (setting.theme !== state.theme) {
        // for theme changed
        applyTheme(
          setting.theme === Themes.System
            ? (window.Context.getSystemTheme() as Themes)
            : setting.theme,
        );
      }

      let messages = state.messages;
      if (setting.locale !== state.locale) {
        // for locale changed
        messages = window.Context.getLocaleData();
      }

      dispatch({
        type: Actions.UpdateSetting,
        payload: { ...state, ...setting, messages },
      });
    },
    [state.locale, state.theme, state.mirror],
  );

  const getMessage = useCallback<I18nFn>(
    (key, substitutions) => {
      if (Array.isArray(substitutions) && substitutions.length > 1) {
        throw new Error(
          'Array syntax is not supported with more than one placeholder',
        );
      }

      const { message } = state.messages[key] || { message: key };
      if (!substitutions) {
        return message;
      }

      if (Array.isArray(substitutions)) {
        return substitutions.reduce(
          (result, substitution) =>
            result.toString().replace(/\$.+?\$/, substitution.toString()),
          message,
        ) as string;
      }

      const FIND_REPLACEMENTS = /\$([^$]+)\$/g;

      let match = FIND_REPLACEMENTS.exec(message);
      let builder = '';
      let lastTextIndex = 0;

      while (match) {
        if (lastTextIndex < match.index) {
          builder += message.slice(lastTextIndex, match.index);
        }

        const placeholderName = match[1];
        const value = substitutions[placeholderName];
        if (!value) {
          // eslint-disable-next-line no-console
          console.error(
            `i18n: Value not provided for placeholder ${placeholderName} in key '${key}'`,
          );
        }
        builder += value || '';

        lastTextIndex = FIND_REPLACEMENTS.lastIndex;
        match = FIND_REPLACEMENTS.exec(message);
      }

      if (lastTextIndex < message.length) {
        builder += message.slice(lastTextIndex);
      }

      return builder;
    },
    [state.messages],
  );

  return (
    <ConfigProvider
      locale={state.locale === 'en' ? en : zhCN}
      theme={{
        algorithm:
          state.theme === Themes.System
            ? state.sysTheme === Themes.Dark
              ? antdTheme.darkAlgorithm
              : antdTheme.defaultAlgorithm
            : state.theme === Themes.Dark
            ? antdTheme.darkAlgorithm
            : antdTheme.defaultAlgorithm,
        token: { colorPrimary: '#74a975' },
      }}
    >
      <AppContext.Provider
        value={{
          locale: state.locale,
          theme: state.theme,
          mirror: state.mirror,
          getMessage,
          onUpdateSetting,
        }}
      >
        <AntdApp>
          <RouterProvider router={router} />
        </AntdApp>
      </AppContext.Provider>
    </ConfigProvider>
  );
}

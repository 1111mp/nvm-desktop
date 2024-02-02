import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState
} from "react";
import { Closer, Themes } from "@src/types";
import { applyTheme } from "./util";

type AppContextType = {
  locale: string;
  theme: Themes;
  color: string;
  closer: Closer;
  directory: string;
  mirror: string;
  setColor: (color: string) => void;
  getMessage: I18nFn;
  onUpdateSetting: (setting: Nvmd.Setting) => Promise<void>;
};

type StateType = {
  locale: string;
  theme: Themes; // from setting
  closer: Closer;
  directory: string; // node installation directory
  sysTheme: Themes; // system real theme
  mirror: string;
  messages: I18n.Message;
};

enum Actions {
  ThemeChanged = "THEME_CHANGED",
  UpdateSetting = "UPDATE_SETTING"
}

type StateAction = {
  type: Actions;
  payload: Partial<StateType>;
};

type ReplacementValuesType = {
  [key: string]: string | number;
};

export type I18nFn = (
  key: string,
  substitutions?: Array<string | number> | ReplacementValuesType
) => string;

export const AppProviderContext = createContext<AppContextType | null>(null);

export function AppProvider({ defaultColor = "orange", storageKey = "nvmd-ui-theme", children }) {
  const { locale, theme, closer, directory, mirror, localeMessages } =
    window.Context.getSettingData();

  const [color, setColor] = useState<string>(
    () => localStorage.getItem(storageKey) || defaultColor
  );

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
      closer,
      directory,
      sysTheme: window.Context.getSystemTheme() as Themes,
      mirror,
      messages: localeMessages
    }
  );

  useEffect(() => {
    applyTheme(theme === Themes.System ? (window.Context.getSystemTheme() as Themes) : theme);
  }, []);

  // system theme
  useEffect(() => {
    window.Context.onRegistThemeCallback((systemTheme) => {
      // Themes.Light or Themes.Dark
      state.theme === Themes.System && applyTheme(systemTheme as Themes);
      dispatch({
        type: Actions.ThemeChanged,
        payload: { sysTheme: systemTheme as Themes }
      });
    });
  }, [state.theme]);

  // theme color
  useEffect(() => {
    document.body.classList.forEach((className) => {
      if (className.match(/^theme.*/)) {
        document.body.classList.remove(className);
      }
    });

    if (color) {
      return document.body.classList.add(`theme-${color}`);
    }
  }, [color]);

  // update setting
  const onUpdateSetting = useMemo(
    () => async (setting: Nvmd.Setting) => {
      await window.Context.updateSettingData(setting);

      if (setting.theme !== state.theme) {
        // for theme changed
        applyTheme(
          setting.theme === Themes.System
            ? (window.Context.getSystemTheme() as Themes)
            : setting.theme
        );
      }

      let messages = state.messages;
      if (setting.locale !== state.locale) {
        // for locale changed
        messages = window.Context.getLocaleData();
      }

      dispatch({
        type: Actions.UpdateSetting,
        payload: { ...state, ...setting, messages }
      });
    },
    [state.locale, state.theme, state.directory, state.mirror]
  );

  const setColorHandler = useMemo(
    () => (newColor: string) => {
      localStorage.setItem(storageKey, newColor);
      startTransition(() => {
        setColor(newColor);
      });
    },
    []
  );

  const getMessage = useCallback<I18nFn>(
    (key, substitutions) => {
      if (Array.isArray(substitutions) && substitutions.length > 1) {
        throw new Error("Array syntax is not supported with more than one placeholder");
      }

      const { message } = state.messages[key] || { message: key };
      if (!substitutions) {
        return message;
      }

      if (Array.isArray(substitutions)) {
        return substitutions.reduce(
          (result, substitution) => result.toString().replace(/\$.+?\$/, substitution.toString()),
          message
        ) as string;
      }

      const FIND_REPLACEMENTS = /\$([^$]+)\$/g;

      let match = FIND_REPLACEMENTS.exec(message);
      let builder = "";
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
            `i18n: Value not provided for placeholder ${placeholderName} in key '${key}'`
          );
        }
        builder += value || "";

        lastTextIndex = FIND_REPLACEMENTS.lastIndex;
        match = FIND_REPLACEMENTS.exec(message);
      }

      if (lastTextIndex < message.length) {
        builder += message.slice(lastTextIndex);
      }

      return builder;
    },
    [state.messages]
  );

  return (
    <AppProviderContext.Provider
      value={{
        locale: state.locale,
        theme: state.theme,
        closer: state.closer,
        directory: state.directory,
        mirror: state.mirror,
        color,
        setColor: setColorHandler,
        getMessage,
        onUpdateSetting
      }}
    >
      {children}
    </AppProviderContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppProviderContext);
  if (!context) {
    // this is especially useful in TypeScript so you don't need to be checking for null all the time
    throw new Error("You have forgot to use AppContext.Provider, shame on you.");
  }
  return context;
}

export const useI18n = (): I18nFn => {
  const { getMessage } = useAppContext();
  return getMessage;
};

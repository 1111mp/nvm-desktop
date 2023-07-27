import './App.scss';

import { useEffect, useReducer, useMemo } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { AppContext } from './appContext';
import { router } from './routes';
import { Themes, applyTheme } from './util';

type StateType = {
  theme: Themes; // from setting
  sysTheme: Themes; // system real theme
};

enum ActionType {
  ThemeChanged = 'THEME_CHANGED',
}

type StateAction = {
  type: ActionType;
  payload: StateType;
};

export default function App() {
  const storageTheme = (localStorage.getItem('nvmd-theme') ||
    Themes.System) as Themes;

  const [state, dispatch] = useReducer(
    (state: StateType, action: StateAction) => {
      switch (action.type) {
        case ActionType.ThemeChanged: {
          return { ...state, ...action.payload };
        }
        default:
          return state;
      }
    },
    {
      theme: storageTheme,
      sysTheme: window.Context.getSystemTheme() as Themes,
    },
  );

  useEffect(() => {
    window.Context.onRegistThemeCallback((systemTheme) => {
      // Themes.Light or Themes.Dark
      applyTheme(systemTheme as Themes);
      dispatch({
        type: ActionType.ThemeChanged,
        payload: { ...state, sysTheme: systemTheme as Themes },
      });
    });
  }, [state.theme]);

  const onThemeChanged = useMemo(
    () => (theme: Themes) => {
      dispatch({
        type: ActionType.ThemeChanged,
        payload: { ...state, theme },
      });
    },
    [state.sysTheme],
  );

  return (
    <ConfigProvider
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
      <AppContext.Provider value={{ theme: state.theme, onThemeChanged }}>
        <RouterProvider router={router} />
      </AppContext.Provider>
    </ConfigProvider>
  );
}

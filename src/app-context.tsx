import { createContext, useContext } from 'react';
import { useColor, useI18n, useSettings, useTheme } from './hooks';

import { SystemTheme } from '@/types';

type AppContextType = {
  color: string;
  settings: Nvmd.Setting;
  updateColor: (color: string) => void;
  updateSetting: (setting: Nvmd.Setting) => Promise<void>;
};

export const AppProviderContext = createContext<AppContextType | null>(null);

export function AppProvider({
  settings: defaultSettings,
  sysTheme: defaultSysTheme,
  children,
}: {
  settings: Nvmd.Setting;
  sysTheme: SystemTheme;
  children?: React.ReactNode;
}) {
  /// app settings
  const { settings, updateSetting } = useSettings(defaultSettings);
  /// app color
  const { color, updateColor } = useColor();
  /// app theme
  useTheme(settings.theme, defaultSysTheme);
  /// app i18n
  useI18n(settings.locale);

  return (
    <AppProviderContext
      value={{
        color,
        settings,
        updateColor,
        updateSetting,
      }}
    >
      {children}
    </AppProviderContext>
  );
}

export function useAppContext() {
  const context = useContext(AppProviderContext);
  if (!context) {
    // this is especially useful in TypeScript so you don't need to be checking for null all the time
    throw new Error(
      'You have forgot to use AppContext.Provider, shame on you.',
    );
  }
  return context;
}

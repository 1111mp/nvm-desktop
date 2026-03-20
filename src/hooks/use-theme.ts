import { useEffect, useRef } from 'react';
import { getCurrent } from '@/services/api';
import { applyTheme } from '@/lib/utils';
import { SystemTheme, Themes } from '@/types';
import { getSystemTheme } from '@/services/cmds';

export function useTheme(theme: Themes, defaultSysTheme: SystemTheme) {
  const sysTheme = useRef<SystemTheme>(defaultSysTheme);

  useEffect(() => {
    const webviewWindow = getCurrent();
    if (theme !== Themes.System) {
      applyTheme(theme as unknown as SystemTheme);
      // update the theme of the window
      webviewWindow.setTheme(theme);
      return;
    }

    const applyFromSystemTheme = async () => {
      const systemTheme = await getSystemTheme();
      if (
        systemTheme === SystemTheme.Light ||
        systemTheme === SystemTheme.Dark
      ) {
        applyTheme(systemTheme);
      }
      // update the theme of the window
      webviewWindow.setTheme(null);
    };

    applyFromSystemTheme();
  }, [theme]);

  // theme change listener
  useEffect(() => {
    if (theme !== Themes.System) return;

    const webviewWindow = getCurrent();
    const listener = webviewWindow.onThemeChanged((e) => {
      const newSysTheme = e.payload as SystemTheme;
      sysTheme.current = newSysTheme;
      applyTheme(newSysTheme);
    });

    return () => {
      listener.then((fn) => fn());
    };
  }, [theme]);
}

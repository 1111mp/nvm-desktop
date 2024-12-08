import { useEffect, useRef } from 'react';

import { getCurrent } from '@/services/api';
import { applyTheme } from '@/lib/utils';
import { SystemTheme, Themes } from '@/types';

export function useTheme(theme: Themes, defaultSysTheme: SystemTheme) {
  const sysTheme = useRef<SystemTheme>(defaultSysTheme);

  useEffect(() => {
    if (theme !== Themes.System) {
      applyTheme(theme as unknown as SystemTheme);
      return;
    }

    const webviewWindow = getCurrent();
    if (sysTheme.current) {
      applyTheme(sysTheme.current);
    }
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

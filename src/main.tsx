import '@/services/i18n';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app';

import { getAppInitialData } from '@/services/api';
import { applyTheme } from './lib/utils';
import { SystemTheme, Themes } from './types';

/**
 * Get user settings data & system theme in advance.
 * Can solve the view flickering caused by refresh (caused by theme).
 * This would have increased the delay in loading the first screen.
 * However, thanks to the powerful performance of `rust`, the time consumption is within an acceptable range.
 * The delay is always within `15ms` (in development).
 */
(async () => {
  const [settings, sysTheme] = await getAppInitialData();

  // Set the theme in advance to prevent flickering.
  applyTheme(
    settings.theme !== Themes.System
      ? (settings.theme as unknown as SystemTheme)
      : sysTheme,
  );
  if (OS_PLATFORM !== 'darwin') {
    document.documentElement.classList.add('beauty-scrollbar');
  }

  createRoot(document.getElementById('root') as HTMLElement).render(
    <StrictMode>
      <App settings={settings} sysTheme={sysTheme} />
    </StrictMode>,
  );
})();

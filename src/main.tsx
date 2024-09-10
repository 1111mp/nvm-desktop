import '@/services/i18n';

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app';

import { getSettings } from '@/services/cmds';
import { getSystemCurrentTheme } from '@/services/api';

/**
 * Get user settings data & system theme in advance.
 * Can solve the view flickering caused by refresh (caused by theme).
 * This would have increased the delay in loading the first screen.
 * However, thanks to the powerful performance of `rust`, the time consumption is within an acceptable range.
 * The delay is always within `15ms` (in development)
 */
(async () => {
	const [settings, sysTheme] = await Promise.all([
		getSettings(),
		getSystemCurrentTheme(),
	]);

	createRoot(document.getElementById('root') as HTMLElement).render(
		<React.StrictMode>
			<App settings={settings} sysTheme={sysTheme} />
		</React.StrictMode>
	);
})();

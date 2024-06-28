import './global.css';

import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster, TooltipProvider } from '@/components/ui';

import { router } from '@/routes';
import { AppProvider } from '@/app-context';
import { getCurrent } from '@/services/api';
import { SystemTheme } from '@/types';

export default function App({
	settings,
	sysTheme,
}: {
	settings: Nvmd.Setting;
	sysTheme: SystemTheme;
}) {
	useEffect(() => {
		// open main webview window
		setTimeout(() => {
			const webviewWindow = getCurrent();
			webviewWindow.unminimize();
			webviewWindow.show();
			webviewWindow.setFocus();
		});
	}, []);

	return (
		<AppProvider settings={settings} sysTheme={sysTheme}>
			<TooltipProvider delayDuration={200}>
				<RouterProvider router={router} />
			</TooltipProvider>
			<Toaster />
		</AppProvider>
	);
}

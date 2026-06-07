import './styles/global.css';

import { Toaster, TooltipProvider } from '@/components/ui';
import { useEffect } from 'react';
import { RouterProvider } from 'react-router';

import { AppProvider } from '@/app-context';
import { router } from '@/routes';
import { SystemTheme } from '@/types';

export default function App({
  settings,
  sysTheme,
}: {
  settings: Nvmd.Setting;
  sysTheme: SystemTheme;
}) {
  /// Disable right-click context menu
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return (
    <AppProvider settings={settings} sysTheme={sysTheme}>
      <TooltipProvider delayDuration={200}>
        <RouterProvider router={router} />
      </TooltipProvider>
      <Toaster position='top-center' />
    </AppProvider>
  );
}

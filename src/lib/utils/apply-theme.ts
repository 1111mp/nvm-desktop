import { SystemTheme } from '@/types';

export function applyTheme(theme: SystemTheme) {
  const root = window.document.documentElement;

  if (root.classList.contains(theme)) return;

  root.classList.remove('light', 'dark');
  root.classList.add(theme);
}

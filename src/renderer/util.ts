export enum Themes {
  System = 'system',
  Light = 'light',
  Dark = 'dark',
}

export function applyTheme(theme: Themes) {
  if (window.document.body.classList.contains(`${theme}-theme`)) return;

  window.document.body.classList.remove('dark-theme');
  window.document.body.classList.remove('light-theme');
  window.document.body.classList.add(`${theme}-theme`);
}

import semver from 'semver';
import { Themes } from '@src/types';

export function applyTheme(theme: Themes) {
  if (window.document.body.classList.contains(`${theme}-theme`)) return;

  window.document.body.classList.remove('dark-theme');
  window.document.body.classList.remove('light-theme');
  window.document.body.classList.add(`${theme}-theme`);
}

export function checkSupportive(files: string[]): boolean {
  const { platform, arch } = window.Context;
  const name =
    platform === 'darwin'
      ? `osx-${arch}`
      : platform === 'win32'
      ? `win-${arch}`
      : `${platform}-${arch}`;

  return !!files.find((file) => file.includes(name));
}

export function compareVersion(version1: string, version2: string): number {
  version1 = version1.slice(1);
  version2 = version2.slice(1);

  return semver.gt(version2, version1) ? -1 : 1;
}

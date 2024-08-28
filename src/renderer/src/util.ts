import semver from "semver";
import { Themes } from "@src/types";

export function applyTheme(theme: Themes) {
  const root = window.document.documentElement;

  if (root.classList.contains(theme)) return;

  root.classList.remove("light", "dark");
  root.classList.add(theme);
}

export function checkSupportive(files: string[]): boolean {
  const { platform, arch } = window.Context;
  const name =
    platform === "darwin"
      ? `osx-${arch}`
      : platform === "win32"
        ? `win-${arch}`
        : `${platform}-${arch}`;

  return !!files.find((file) => file.includes(name));
}

export function compareVersion(version1: string, version2: string): number {
  version1 = version1.slice(1);
  version2 = version2.slice(1);

  return semver.gt(version2, version1) ? -1 : 1;
}

type Obj = Record<string, any>;

export function compareObject(obj1: Obj, obj2: Obj) {
  let ret = true;
  for (let key in obj1) {
    if (obj1[key] !== obj2[key]) {
      ret = false;
    }
  }
  return ret;
}

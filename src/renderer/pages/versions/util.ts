import { useCallback, useEffect, useRef } from 'react';
import semver from 'semver';

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

  return semver.gt(version2, version1) as unknown as number;
}

/**
 * `useEventCallback` will return a memoized version of the callback that only changes if one of the `inputs`
 * has changed.
 */
export function useEventCallback<T extends Function>(fn: T): T {
  const ref = useRef<T>(fn);

  useEffect(() => {
    ref.current = fn;
  });

  return useCallback(
    (...args: unknown[]) => ref.current.apply(void 0, args),
    [],
  ) as unknown as T;
}

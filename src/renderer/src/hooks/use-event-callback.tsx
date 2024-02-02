import { useCallback, useEffect, useRef } from "react";

/**
 * `useEventCallback` will return a memoized version of the callback that only changes if one of the `inputs`
 * has changed.
 */
export function useEventCallback<T extends Function>(fn: T): T {
  const ref = useRef<T>(fn);

  useEffect(() => {
    ref.current = fn;
  });

  return useCallback((...args: unknown[]) => ref.current.apply(void 0, args), []) as unknown as T;
}

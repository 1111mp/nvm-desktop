import { useSyncExternalStore } from 'react';

export type VersionDensity = 'comfortable' | 'compact';
const storageKey = 'nvmd-version-density';
const changeEvent = 'nvmd-version-density-change';
let fallback: VersionDensity = 'comfortable';
let memoryOnly = false;

function getSnapshot(): VersionDensity {
  if (memoryOnly) return fallback;
  try {
    return localStorage.getItem(storageKey) === 'compact'
      ? 'compact'
      : 'comfortable';
  } catch {
    return fallback;
  }
}

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey || event.key === null) onChange();
  };
  window.addEventListener(changeEvent, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(changeEvent, onChange);
    window.removeEventListener('storage', onStorage);
  };
}

export function useVersionDensity() {
  const density = useSyncExternalStore(subscribe, getSnapshot);
  const setDensity = (value: VersionDensity) => {
    fallback = value;
    try {
      localStorage.setItem(storageKey, value);
    } catch {
      memoryOnly = true;
      // Keep both pages in sync even when persistence is unavailable.
    }
    window.dispatchEvent(new Event(changeEvent));
  };
  return { density, setDensity };
}

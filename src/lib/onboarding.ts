// Keep the existing key so users who dismissed the old tour are not prompted again.
const STORAGE_KEY = 'nvmd-first';

export function shouldShowOnboarding() {
  try {
    return localStorage.getItem(STORAGE_KEY) === null;
  } catch {
    return false;
  }
}

export function markOnboardingSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, 'no');
  } catch {
    // Dismissing the dialog must still work when storage is unavailable.
  }
}

export function resetOnboarding() {
  try {
    // Only reset persistence; the mounted tour stays closed until the next app load.
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

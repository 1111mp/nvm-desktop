import { startTransition, useEffect, useState } from 'react';

export function useColor({
  defaultColor = 'orange',
  storageKey = 'nvmd-ui-theme',
}: {
  defaultColor?: string;
  storageKey?: string;
} = {}) {
  const [color, setColor] = useState<string>(
    () => localStorage.getItem(storageKey) || defaultColor,
  );

  useEffect(() => {
    document.body.classList.forEach((className) => {
      if (className.match(/^theme.*/)) {
        document.body.classList.remove(className);
      }
    });

    if (color) {
      return document.body.classList.add(`theme-${color}`);
    }
  }, [color]);

  const updateColor = (newColor: string) => {
    localStorage.setItem(storageKey, newColor);
    startTransition(() => {
      setColor(newColor);
    });
  };

  return {
    color,
    updateColor,
  };
}

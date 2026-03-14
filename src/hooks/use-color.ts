import { startTransition, useEffect, useState } from 'react';

type AppColor = {
  baseColor: string;
  theme: string;
  radius: string;
};

function useColor({
  defaultColor = {
    baseColor: 'neutral',
    theme: '',
    radius: '',
  },
  storageKey = 'nvmd-ui-theme',
}: {
  defaultColor?: AppColor;
  storageKey?: string;
} = {}) {
  const [color, setColor] = useState<AppColor>(() => {
    try {
      const storageStr = localStorage.getItem(storageKey);
      return storageStr ? JSON.parse(storageStr) : { ...defaultColor };
    } catch {
      return { ...defaultColor };
    }
  });

  // base color
  useEffect(() => {
    document.body.classList.forEach((className) => {
      if (className.match(/^color.*/)) {
        document.body.classList.remove(className);
      }
    });

    if (color.baseColor) {
      return document.body.classList.add(`color-${color.baseColor}`);
    }
  }, [color.baseColor]);

  // theme
  useEffect(() => {
    document.body.classList.forEach((className) => {
      if (className.match(/^theme.*/)) {
        document.body.classList.remove(className);
      }
    });

    if (color.theme) {
      return document.body.classList.add(`theme-${color.theme}`);
    }
  }, [color.theme]);

  // radius
  useEffect(() => {
    document.body.classList.forEach((className) => {
      if (className.match(/^radius.*/)) {
        document.body.classList.remove(className);
      }
    });

    if (color.radius) {
      return document.body.classList.add(`radius-${color.radius}`);
    }
  }, [color.radius]);

  const updateColor = (newColor: Partial<AppColor>) => {
    startTransition(() => {
      setColor((prev) => {
        const nextColor = {
          ...prev,
          ...newColor,
        };
        localStorage.setItem(storageKey, JSON.stringify(nextColor));
        return nextColor;
      });
    });
  };

  return {
    color,
    updateColor,
  };
}

export { useColor, type AppColor };

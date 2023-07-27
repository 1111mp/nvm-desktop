import { createContext, useContext } from 'react';
import { Themes } from './util';

type AppContextType = {
  theme: Themes;
  onThemeChanged: (theme: Themes) => void;
};

export const AppContext = createContext<AppContextType | null>(null);

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    // this is especially useful in TypeScript so you don't need to be checking for null all the time
    throw new Error(
      'You have forgot to use AppContext.Provider, shame on you.',
    );
  }
  return context;
}

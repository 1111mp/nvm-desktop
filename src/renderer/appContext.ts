import { createContext, useContext } from 'react';
import { Themes } from 'types';

type AppContextType = {
  locale: string;
  theme: Themes;
  mirror: string;
  getMessage: I18nFn;
  onUpdateSetting: (setting: Nvmd.Setting) => Promise<void>;
};

type ReplacementValuesType = {
  [key: string]: string | number;
};

export type I18nFn = (
  key: string,
  substitutions?: Array<string | number> | ReplacementValuesType,
) => string;

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

export const useI18n = (): I18nFn => {
  const { getMessage } = useAppContext();
  return getMessage;
};

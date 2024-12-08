import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function useI18n(locale: string) {
  const { i18n } = useTranslation();

  useEffect(() => {
    i18n.changeLanguage(locale);
  }, [locale]);
}

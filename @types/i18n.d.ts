declare namespace I18n {
  type Placeholders = {
    status: {
      content: string;
      example: string;
    };
  };

  interface Message {
    [key: string]: {
      message: string;
      description: string;
      placeholders?: Placeholders;
    };
  }

  interface Locale {
    i18n: I18nFn;
    locale: string;
    messages: Message;
  }

  type ReplacementValuesType = {
    [key: string]: string | number;
  };

  type I18nFn = {
    (
      key: string,
      substitutions?: (string | number)[] | I18n.ReplacementValuesType,
    ): string | number;
    getLocale(): string;
  };
}

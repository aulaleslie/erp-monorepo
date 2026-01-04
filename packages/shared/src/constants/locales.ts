export enum Locale {
  EN = 'en',
  ID = 'id',
}

export const LOCALE_LABELS: Record<Locale, string> = {
  [Locale.EN]: 'English',
  [Locale.ID]: 'Bahasa Indonesia',
};

export const DEFAULT_LOCALE: Locale = Locale.EN;

export const SUPPORTED_LOCALES: readonly Locale[] = Object.values(Locale);

export const isSupportedLocale = (value: string): value is Locale =>
  SUPPORTED_LOCALES.includes(value as Locale);
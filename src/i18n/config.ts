export const defaultLocale = 'en';

/** Non-default locales, in the order shown in the language switcher. */
export const otherLocales = ['es', 'de', 'pt-br', 'it', 'nl'] as const;
export type OtherLocale = (typeof otherLocales)[number];
export type Locale = typeof defaultLocale | OtherLocale;

export interface LocaleMeta {
  /** BCP 47 tag for <html lang>, hreflang and speech synthesis. */
  tag: string;
  /** Open Graph locale. */
  og: string;
  /** Name of the language in that language. */
  label: string;
  /** Hero tool, chosen to match the language's primary keyword. */
  hero: 'toy' | 'wheel';
}

export const localeMeta: Record<Locale, LocaleMeta> = {
  en: { tag: 'en', og: 'en_US', label: 'English', hero: 'toy' },
  es: { tag: 'es', og: 'es_ES', label: 'Español', hero: 'wheel' },
  de: { tag: 'de', og: 'de_DE', label: 'Deutsch', hero: 'toy' },
  'pt-br': { tag: 'pt-BR', og: 'pt_BR', label: 'Português (Brasil)', hero: 'wheel' },
  it: { tag: 'it', og: 'it_IT', label: 'Italiano', hero: 'wheel' },
  nl: { tag: 'nl', og: 'nl_NL', label: 'Nederlands', hero: 'toy' },
};

export const SITE = 'https://yesnobuttonapp.com';

export function isLocale(x: string | undefined): x is Locale {
  return !!x && x in localeMeta;
}

import { en, type Ui } from './locales/en';
import { es, esHome } from './locales/es';
import { de, deHome } from './locales/de';
import { ptBr, ptBrHome } from './locales/pt-br';
import { it, itHome } from './locales/it';
import { nl, nlHome } from './locales/nl';
import { defaultLocale, isLocale, localeMeta, otherLocales, SITE, type Locale } from './config';
import type { HomeContent } from './types';

const ui: Record<Locale, Partial<Ui>> = { en, es, de, 'pt-br': ptBr, it, nl };
const homes: Record<Exclude<Locale, 'en'>, HomeContent> = {
  es: esHome, de: deHome, 'pt-br': ptBrHome, it: itHome, nl: nlHome,
};

export function getLocale(astro: { currentLocale?: string }): Locale {
  return isLocale(astro.currentLocale) ? astro.currentLocale : defaultLocale;
}

/** Full UI dictionary for a locale; missing keys fall back to English. */
export function getUi(locale: Locale): Ui {
  return { ...en, ...ui[locale] };
}

export function getHome(locale: Exclude<Locale, 'en'>): HomeContent {
  return homes[locale];
}

export function fmt(s: string, vars: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}

export function homePath(locale: Locale): string {
  return locale === defaultLocale ? '/' : `/${locale}/`;
}

/** hreflang cluster for the homepage in every language, plus x-default. */
export function homeAlternates(): { hreflang: string; href: string }[] {
  const all: Locale[] = [defaultLocale, ...otherLocales];
  return [
    ...all.map((l) => ({ hreflang: localeMeta[l].tag, href: SITE + homePath(l) })),
    { hreflang: 'x-default', href: SITE + '/' },
  ];
}

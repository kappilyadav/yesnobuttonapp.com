// Browser-side access to the page's translations. BaseLayout embeds the
// locale's dictionary as JSON on localized pages; English pages have none
// and fall back to the English dictionary.
import { en, type Ui } from './locales/en';

interface Bridge {
  ui: Ui;
  /** BCP 47 tag used for speech synthesis. */
  tag: string;
}

let bridge: Bridge | null = null;

export function i18n(): Bridge {
  if (bridge) return bridge;
  bridge = { ui: en, tag: 'en' };
  try {
    const el = document.getElementById('ynb-i18n');
    if (el?.textContent) {
      const data = JSON.parse(el.textContent);
      bridge = { ui: { ...en, ...data.ui }, tag: data.tag || 'en' };
    }
  } catch {}
  return bridge;
}

export function fmt(s: string, vars: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}

/** Localized word for a result key, e.g. 'yes' -> 'Sí'. */
export function resultLabel(result: 'yes' | 'no' | 'maybe'): string {
  return i18n().ui[result];
}

/** Maps a localized (or English) word back to a result key, or null. */
export function resultFromLabel(label: string): 'yes' | 'no' | 'maybe' | null {
  const l = label.trim().toLowerCase();
  const { ui } = i18n();
  for (const k of ['yes', 'no', 'maybe'] as const) {
    if (l === ui[k].toLowerCase() || l === en[k].toLowerCase()) return k;
  }
  return null;
}

export function speak(text: string) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = i18n().tag;
  u.rate = 1;
  u.pitch = 1;
  window.speechSynthesis.speak(u);
}

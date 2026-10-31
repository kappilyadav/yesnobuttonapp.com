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

// Chrome can garbage-collect an utterance mid-speech and silently drop it,
// so keep a strong reference to the one that is playing.
let currentUtterance: SpeechSynthesisUtterance | null = null;
// Invalidates delayed speak() calls from presses that were superseded.
let speakSeq = 0;

/** An on-device voice for the page language, used when the default voice fails. */
function localVoice(): SpeechSynthesisVoice | null {
  const tag = i18n().tag.toLowerCase();
  const base = tag.split('-')[0];
  const matches = window.speechSynthesis.getVoices().filter((v) => {
    if (!v.localService) return false;
    const l = v.lang.toLowerCase().replace('_', '-');
    return l === tag || l.split('-')[0] === base;
  });
  return matches.find((v) => v.default) || matches[0] || null;
}

export function speak(text: string) {
  if (!('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;
  const seq = ++speakSeq;

  const run = (voice?: SpeechSynthesisVoice | null) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = i18n().tag;
    u.rate = 1;
    u.pitch = 1;
    if (voice) u.voice = voice;
    u.onerror = (e) => {
      // 'interrupted' / 'canceled' just mean a newer press took over.
      if (e.error === 'interrupted' || e.error === 'canceled' || voice) return;
      // Default voice failed (e.g. a network voice while offline): retry once on-device.
      const fallback = localVoice();
      if (fallback && seq === speakSeq) run(fallback);
    };
    currentUtterance = u;
    synth.speak(u);
  };

  if (synth.speaking || synth.pending) {
    synth.cancel();
    // Chrome drops an utterance queued in the same tick as cancel(), so let
    // the engine settle first. Only done when something is actually playing,
    // so the first press still speaks synchronously inside the user gesture.
    window.setTimeout(() => {
      if (seq !== speakSeq) return;
      if (synth.paused) synth.resume();
      run();
    }, 60);
  } else {
    // Chrome sometimes leaves the engine paused after a stalled utterance.
    if (synth.paused) synth.resume();
    run();
  }
}

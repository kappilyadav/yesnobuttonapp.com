// scripts/tool.ts
import { Events } from './analytics';

export type Result = 'yes' | 'no' | 'maybe';
type Mode = 'binary' | 'three-way';

interface HistoryEntry {
  result: Result;
  timestamp: number;
}

const MODE_STORAGE_KEY = 'ynb_mode';
const MODE_DEFAULT: Mode = 'binary';

let currentMode: Mode = MODE_DEFAULT;

function loadMode(): Mode {
  try {
    const stored = localStorage.getItem(MODE_STORAGE_KEY);
    if (stored === 'binary' || stored === 'three-way') return stored;
  } catch {}
  return MODE_DEFAULT;
}

function saveMode(mode: Mode) {
  try {
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  } catch {}
}

function setMode(mode: Mode) {
  currentMode = mode;
  saveMode(mode);
  const buttons = document.querySelectorAll('[data-ynb-mode]');
  buttons.forEach((btn) => {
    const el = btn as HTMLElement;
    const btnMode = el.getAttribute('data-ynb-mode');
    const isActive = btnMode === mode;
    el.classList.toggle('mode-active', isActive);
    el.setAttribute('aria-checked', String(isActive));
  });
}

const STORAGE_KEY = 'ynb_history';
const MAX_HISTORY = 10;

function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: HistoryEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function addToHistory(result: Result) {
  const history = getHistory();
  history.unshift({ result, timestamp: Date.now() });
  if (history.length > MAX_HISTORY) history.pop();
  saveHistory(history);
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

let _historyContainer: HTMLElement | null = null;
let _historyCounts: HTMLElement | null = null;
let _historyTracker: HTMLElement | null = null;

export function initHistoryElements() {
  _historyContainer = document.getElementById('history-pills') as HTMLElement | null;
  _historyCounts = document.getElementById('history-counts') as HTMLElement | null;
  _historyTracker = document.getElementById('history-tracker') as HTMLElement | null;
}

export function renderHistory() {
  if (!_historyContainer || !_historyCounts) return;
  const history = getHistory();
  _historyContainer.innerHTML = '';
  const counts = { yes: 0, no: 0, maybe: 0 };

  if (_historyTracker) {
    _historyTracker.classList.toggle('hidden', history.length === 0);
  }

  if (history.length === 0) return;

  history.forEach((entry) => {
    counts[entry.result]++;
    const pill = document.createElement('span');
    let classes = 'inline-flex items-center px-[14px] py-[6px] rounded-full text-xs font-medium animate-slide-in-right ';
    switch (entry.result) {
      case 'yes':
        classes += 'pill-yes';
        break;
      case 'no':
        classes += 'pill-no';
        break;
      case 'maybe':
        classes += 'pill-maybe';
        break;
    }
    pill.className = classes;
    pill.textContent = entry.result.toUpperCase();
    _historyContainer.appendChild(pill);
  });

  const parts: string[] = [];
  if (counts.yes > 0) parts.push(`Yes: ${counts.yes}`);
  if (counts.no > 0) parts.push(`No: ${counts.no}`);
  if (counts.maybe > 0) parts.push(`Maybe: ${counts.maybe}`);
  _historyCounts.textContent = parts.length > 0 ? parts.join(' · ') : 'No results yet';
}

function initModeToggle() {
  currentMode = loadMode();
  const buttons = document.querySelectorAll('[data-ynb-mode]');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-ynb-mode') as Mode;
      setMode(mode);
    });
  });
  setMode(currentMode);
}

export function getResult(): Result {
  if (currentMode === 'three-way') {
    const r = Math.random();
    if (r < 0.333) return 'no';
    if (r < 0.666) return 'yes';
    return 'maybe';
  }
  return Math.random() < 0.5 ? 'no' : 'yes';
}

function speakResult(text: string) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}

function updateSpeechIndicator() {
  const speechIndicator = document.getElementById('speech-indicator') as HTMLElement | null;
  if (!speechIndicator) return;
  if (!('speechSynthesis' in window)) {
    speechIndicator.classList.add('hidden');
    return;
  }
  speechIndicator.classList.remove('hidden');
  const checkSpeaking = setInterval(() => {
    if (!window.speechSynthesis.speaking) {
      speechIndicator.classList.add('hidden');
      clearInterval(checkSpeaking);
    }
  }, 200);
}

/**
 * Records a result to history + analytics without any visual popup.
 * Used by lightweight, in-place confirmations (e.g. the toy button's
 * manual Yes/No/Maybe presses) that don't warrant a fullscreen reveal.
 */
export function recordResult(result: Result) {
  addToHistory(result);
  renderHistory();
  Events.resultShown(result);
  window.dispatchEvent(new Event('ynb:result'));
}

let popupTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Re-rolls the result while the popup is already open. Plays a quick
 * exit animation on the card first so there's always a visible "gone,
 * then back" beat — without it, a repeat result (e.g. Yes -> Yes) swaps
 * text in the same tick and can look like the popup froze.
 */
function tryAgain(question?: string) {
  const popupCard = document.getElementById('popup-card') as HTMLElement | null;
  const nextResult = getResult();

  if (!popupCard) {
    showResultPopup(nextResult, question);
    return;
  }

  let proceeded = false;
  const proceed = () => {
    if (proceeded) return;
    proceeded = true;
    popupCard.removeEventListener('animationend', onExitEnd);
    showResultPopup(nextResult, question);
  };
  const onExitEnd = () => proceed();

  popupCard.classList.remove('animate-popup-entry');
  void popupCard.offsetWidth;
  popupCard.classList.add('animate-popup-exit');
  popupCard.addEventListener('animationend', onExitEnd, { once: true });

  // Safety net: if the animationend event never fires for any reason
  // (backgrounded tab, reduced motion, browser quirks), still proceed —
  // a missed animation should never leave the popup stuck invisible.
  setTimeout(proceed, 160);
}

/**
 * Shows the shared fullscreen result popup. Queries #result-popup by id
 * at call time so it works from any script context on a page that
 * renders <ResultPopup />, regardless of whether #decide-btn exists.
 */
export function showResultPopup(result: Result, question?: string) {
  const popup = document.getElementById('result-popup') as HTMLElement | null;
  const popupAnswer = document.getElementById('popup-answer') as HTMLElement | null;
  if (!popup || !popupAnswer) return;

  const popupCard = document.getElementById('popup-card') as HTMLElement | null;
  const popupQuestion = document.getElementById('popup-question') as HTMLElement | null;
  const popupProgress = document.getElementById('popup-progress') as HTMLElement | null;
  const pressAgainBtn = document.getElementById('press-again-btn') as HTMLButtonElement | null;

  popupAnswer.textContent = result.toUpperCase();
  popup.setAttribute('data-result', result);
  popup.classList.remove('hidden');
  popup.classList.add('flex');

  if (popupQuestion) {
    popupQuestion.textContent = question || '';
    popupQuestion.classList.toggle('hidden', !question);
  }

  // Force the entry/bounce animations to restart even when the popup is
  // already open and the new result is identical to the previous one —
  // otherwise a same-result "Try Again" has no visible class change and
  // can look stuck. popup-exit (see press-again handling below) already
  // covers the visible "gone then back" beat; this is the defensive
  // reset so the reveal itself always replays too.
  if (popupCard) {
    popupCard.classList.remove('animate-popup-entry', 'animate-popup-exit');
    void popupCard.offsetWidth;
    popupCard.classList.add('animate-popup-entry');
  }
  popupAnswer.classList.remove('animate-bounce-word');
  void popupAnswer.offsetWidth;
  popupAnswer.classList.add('animate-bounce-word');

  if (pressAgainBtn) {
    pressAgainBtn.onclick = () => tryAgain(question);
  }

  speakResult(result);

  clearTimeout(popupTimer!);
  if (popupProgress) {
    popupProgress.classList.remove('animate-progress-bar');
    void popupProgress.offsetWidth;
    popupProgress.classList.add('animate-progress-bar');
  }
  popupTimer = setTimeout(hideResultPopup, 4000);

  recordResult(result);
  updateSpeechIndicator();
}

export function hideResultPopup() {
  const popup = document.getElementById('result-popup') as HTMLElement | null;
  if (!popup) return;
  popup.classList.add('hidden');
  popup.classList.remove('flex');
  popup.setAttribute('data-result', '');
  if (popupTimer) clearTimeout(popupTimer);
  const speechIndicator = document.getElementById('speech-indicator') as HTMLElement | null;
  if (speechIndicator) speechIndicator.classList.add('hidden');
  const button = document.getElementById('decide-btn') as HTMLButtonElement | null;
  button?.focus();
}

export function initTool() {
  const button = document.getElementById('decide-btn') as HTMLButtonElement | null;
  const input = document.getElementById('question-input') as HTMLInputElement | null;
  initHistoryElements();
  initModeToggle();
  const clearHistoryBtn = document.getElementById('clear-history') as HTMLElement | null;
  const categoryChips = document.querySelectorAll('[data-category-chip]');
  const popup = document.getElementById('result-popup') as HTMLElement | null;

  let pendingResult: Result | null = null;

  function generateAndShow() {
    if (!button) return;
    button.disabled = true;
    const result = pendingResult || getResult();
    pendingResult = null;
    const question = input?.value.trim() || undefined;

    const hasWheel = !!document.getElementById('wheel-group');
    if (hasWheel) {
      // Wheel mode — result shown on the wheel itself, no popup
      speakResult(result);
      recordResult(result);
      updateSpeechIndicator();
    } else {
      showResultPopup(result, question);
    }

    button.disabled = false;
    Events.buttonPressed();
  }

  if (button) {
    button.addEventListener('mousedown', () => {
      pendingResult = getResult();
      button.dataset.pendingResult = pendingResult;
    });

    button.addEventListener('click', (e) => {
      e.preventDefault();
      generateAndShow();
    });
  }

  if (popup) {
    popup.addEventListener('click', (e) => {
      if (e.target === popup) hideResultPopup();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') hideResultPopup();
    });
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
      clearHistory();
      renderHistory();
    });
  }

  categoryChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const question = chip.getAttribute('data-question') || undefined;
      if (!question) return;

      if (input) {
        input.value = question;
        input.dispatchEvent(new Event('input'));
      }

      const category = chip.getAttribute('data-category') || 'general';
      Events.categoryQuestionClicked(category, question);

      if (button) {
        // Page has a real decide button (e.g. oracle, teachers, kids) —
        // route through its normal press flow.
        button.classList.remove('animate-pulse-subtle');
        void button.offsetWidth;
        button.classList.add('animate-pulse-subtle');
        pendingResult = getResult();
        generateAndShow();
      } else {
        // No decide button on this page (e.g. homepage toy layout) —
        // show the result directly so the chip still does something.
        showResultPopup(getResult(), question);
      }
    });
  });

  if (input) {
    input.addEventListener('blur', () => {
      if (input.value.trim()) {
        Events.questionEntered();
      }
    });
  }

  renderHistory();

  const params = new URLSearchParams(window.location.search);
  const resultParam = params.get('result') as Result | null;
  if (resultParam && ['yes', 'no', 'maybe'].includes(resultParam)) {
    const questionParam = params.get('q') || undefined;
    setTimeout(() => showResultPopup(resultParam, questionParam), 500);
  }
}

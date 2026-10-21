import { addToHistory, clearHistory, initHistoryElements, renderHistory } from './tool';
import { fmt, i18n, resultFromLabel, speak } from '../i18n/client';

const CX = 200;
const CY = 200;
const R = 180;

function defaultEntries(): string[] {
  const { yes, no } = i18n().ui;
  return [yes, no, yes, no, yes, no];
}

const SEGMENT_COLORS = [
  '#8B5CF6',
  '#EC4899',
  '#F97316',
  '#EAB308',
  '#22C55E',
  '#3B82F6',
  '#06B6D4',
  '#D946EF',
];

function describeArc(startAngle: number, endAngle: number): string {
  const sr = startAngle * Math.PI / 180;
  const er = endAngle * Math.PI / 180;
  const x1 = CX + R * Math.cos(sr);
  const y1 = CY + R * Math.sin(sr);
  const x2 = CX + R * Math.cos(er);
  const y2 = CY + R * Math.sin(er);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M${CX},${CY} L${x1.toFixed(1)},${y1.toFixed(1)} A${R},${R} 0 ${large} 1 ${x2.toFixed(1)},${y2.toFixed(1)} Z`;
}

function getSegments(entries: string[]): { label: string; start: number; end: number; color: string }[] {
  const sweep = 360 / entries.length;
  return entries.map((label, i) => ({
    label: label.toUpperCase(),
    start: -90 + i * sweep,
    end: -90 + (i + 1) * sweep,
    color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
  }));
}

export function initWheel() {
  const rotator = document.getElementById('wheel-rotator') as SVGGElement | null;
  const segmentsEl = document.getElementById('wheel-segments') as SVGGElement | null;
  const labelsEl = document.getElementById('wheel-labels') as SVGGElement | null;
  const spinBtn = document.getElementById('spin-btn') as SVGGElement | null;

  const questionInput = document.getElementById('question-input') as HTMLInputElement | null;

  const entryInput = document.getElementById('entry-input') as HTMLInputElement | null;
  const addEntryBtn = document.getElementById('add-entry-btn') as HTMLButtonElement | null;
  const entryListEl = document.getElementById('entry-list') as HTMLDivElement | null;
  const entryCountEl = document.getElementById('entry-count') as HTMLSpanElement | null;
  const resultPills = document.getElementById('result-pills') as HTMLDivElement | null;
  const recentResults = document.getElementById('recent-results') as HTMLDivElement | null;

  const popup = document.getElementById('result-popup') as HTMLDivElement | null;
  const popupAnswer = document.getElementById('popup-answer') as HTMLParagraphElement | null;
  const popupQuestion = document.getElementById('popup-question') as HTMLParagraphElement | null;
  const pressAgainBtn = document.getElementById('press-again-btn') as HTMLButtonElement | null;
  const popupProgress = document.getElementById('popup-progress') as HTMLDivElement | null;

  if (!rotator || !segmentsEl || !labelsEl || !spinBtn) return;

  initHistoryElements();

  let entries: string[] = defaultEntries();
  let spinning = false;
  let currentRotation = 0;
  let recentResultsList: string[] = [];
  let popupTimer: ReturnType<typeof setTimeout> | null = null;
  let tickTimer: ReturnType<typeof setTimeout> | null = null;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function drawSegments(entries: string[]) {
    segmentsEl.innerHTML = '';
    labelsEl.innerHTML = '';
    const segs = getSegments(entries);
    segs.forEach(seg => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', describeArc(seg.start, seg.end));
      path.setAttribute('fill', seg.color);
      path.setAttribute('stroke', 'rgba(255,255,255,0.25)');
      path.setAttribute('stroke-width', '1.5');
      segmentsEl.appendChild(path);

      const mid = (seg.start + seg.end) / 2;
      const midRad = mid * Math.PI / 180;
      const textRadius = R * 0.62;
      const lx = CX + textRadius * Math.cos(midRad);
      const ly = CY + textRadius * Math.sin(midRad);
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', lx.toFixed(1));
      text.setAttribute('y', ly.toFixed(1));
      text.setAttribute('fill', '#FFFFFF');
      text.setAttribute('font-size', '20');
      text.setAttribute('font-weight', '700');
      text.setAttribute('font-family', 'Syne, sans-serif');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'central');
      text.textContent = seg.label;

      let rotation = mid;
      if (rotation > 90 && rotation < 270) rotation -= 180;
      text.setAttribute('transform', `rotate(${rotation.toFixed(1)}, ${lx.toFixed(1)}, ${ly.toFixed(1)})`);

      labelsEl.appendChild(text);
    });
  }

  function updatePills(entries: string[]) {
    if (!resultPills) return;
    resultPills.innerHTML = '';
    if (entries.length <= 3) {
      const pct = Math.round(100 / entries.length);
      entries.forEach(entry => {
        const pill = document.createElement('span');
        const idx = entries.indexOf(entry);
        pill.style.backgroundColor = SEGMENT_COLORS[idx % SEGMENT_COLORS.length];
        pill.className = 'px-3.5 py-1 rounded-full text-xs font-medium text-white';
        pill.textContent = `${entry.toUpperCase()} \u00b7 ${pct}%`;
        resultPills.appendChild(pill);
      });
    } else {
      const badge = document.createElement('span');
      badge.className = 'px-4 py-1.5 rounded-full text-xs font-medium bg-muted/20 text-muted dark:text-muted-dark';
      badge.textContent = fmt(i18n().ui.optionsEach, { n: entries.length, p: Math.round(100 / entries.length) });
      resultPills.appendChild(badge);
    }
  }

  function renderEntryList() {
    if (!entryListEl || !entryCountEl) return;
    entryListEl.innerHTML = '';
    entries.forEach((entry, i) => {
      const row = document.createElement('div');
      const odd = i % 2 === 1;
      row.className = `flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors${odd ? ' bg-muted/5' : ''}`;

      const left = document.createElement('div');
      left.className = 'flex items-center gap-2 min-w-0';

      const dot = document.createElement('span');
      dot.className = 'w-2.5 h-2.5 rounded-full shrink-0';
      dot.style.backgroundColor = SEGMENT_COLORS[i % SEGMENT_COLORS.length];

      const label = document.createElement('span');
      label.className = 'font-medium text-ink dark:text-ink-dark truncate';
      label.textContent = entry;

      left.appendChild(dot);
      left.appendChild(label);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'text-muted hover:text-ink dark:hover:text-ink-dark transition-colors p-0.5 cursor-pointer shrink-0';
      removeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3L11 11M11 3L3 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
      removeBtn.setAttribute('aria-label', fmt(i18n().ui.remove, { x: entry }));
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeEntry(i);
      });

      row.appendChild(left);
      row.appendChild(removeBtn);
      entryListEl.appendChild(row);
    });
    const c = entries.length;
    entryCountEl.textContent = fmt(c === 1 ? i18n().ui.entryOne : i18n().ui.entryMany, { n: c });
  }

  function addEntry(text: string) {
    const trimmed = text.trim();
    if (!trimmed || entries.includes(trimmed)) return;
    stopTicking();
    entries.push(trimmed);
    drawSegments(entries);
    updatePills(entries);
    renderEntryList();
    resetWheel();
    if (entryInput) entryInput.value = '';
    entryInput?.focus();
  }

  function removeEntry(index: number) {
    if (entries.length <= 2) return;
    stopTicking();
    entries.splice(index, 1);
    drawSegments(entries);
    updatePills(entries);
    renderEntryList();
    resetWheel();
  }

  function renderRecentResults() {
    if (!recentResults) return;
    recentResults.innerHTML = '';
    recentResultsList.forEach(result => {
      const pill = document.createElement('span');
      const idx = entries.indexOf(result);
      pill.style.backgroundColor = idx >= 0 ? SEGMENT_COLORS[idx % SEGMENT_COLORS.length] : '#8B5CF6';
      pill.className = 'px-2.5 py-0.5 rounded-full text-[11px] font-medium text-white';
      pill.textContent = result;
      recentResults.appendChild(pill);
    });
  }

  function addRecentResult(result: string) {
    recentResultsList.unshift(result);
    if (recentResultsList.length > 10) recentResultsList.pop();
    renderRecentResults();
  }

  function playTickSound() {
    const a = new Audio('/spinner-wheel-tick.mp3');
    a.volume = 0.25;
    a.play().catch(() => {});
  }

  function playTicking() {
    if (prefersReduced) return;
    const start = performance.now();
    const duration = 3200;
    function schedule() {
      const elapsed = performance.now() - start;
      if (elapsed >= duration) return;
      playTickSound();
      const progress = elapsed / duration;
      const interval = 60 + progress * 240;
      tickTimer = setTimeout(schedule, interval);
    }
    schedule();
  }

  function stopTicking() {
    if (tickTimer) {
      clearTimeout(tickTimer);
      tickTimer = null;
    }
  }

  function spin() {
    if (spinning || entries.length < 2) return;
    spinning = true;
    playTicking();
    const resultIdx = Math.floor(Math.random() * entries.length);
    const result = entries[resultIdx];
    const segs = getSegments(entries);
    const seg = segs[resultIdx];
    const mid = (seg.start + seg.end) / 2;
    const jitter = (Math.random() - 0.5) * 20;
    const rest = ((270 - mid + jitter) % 360 + 360) % 360;
    const spins = (5 + Math.floor(Math.random() * 4)) * 360;
    const currentAngle = currentRotation % 360;
    const adjust = ((rest - currentAngle) % 360 + 360) % 360;
    currentRotation += spins + adjust;
    if (prefersReduced) {
      const s = currentRotation % 360;
      currentRotation = currentRotation - (currentRotation % 360) + s;
      rotator.style.transition = 'none';
    } else {
      rotator.style.transition = 'transform 3.2s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
    }
    rotator.style.transform = `rotate(${currentRotation}deg)`;
    setTimeout(() => {
      stopTicking();
      spinning = false;
      addRecentResult(result);
      const normalized = resultFromLabel(result);
      if (normalized === 'yes' || normalized === 'no') {
        addToHistory(normalized);
        renderHistory();
      }
      const question = questionInput?.value.trim() || undefined;
      showPopup(result, question);
    }, prefersReduced ? 50 : 3500);
  }

  function showPopup(result: string, question?: string) {
    if (!popup || !popupAnswer) return;
    popupAnswer.textContent = result.toUpperCase();
    popup.setAttribute('data-result', resultFromLabel(result) ?? result.toLowerCase());
    popup.classList.remove('hidden');
    popup.classList.add('flex');

    if (popupQuestion) {
      popupQuestion.textContent = question || '';
      popupQuestion.classList.toggle('hidden', !question);
    }

    if (pressAgainBtn) {
      pressAgainBtn.onclick = () => { hidePopup(); spin(); };
    }

    speak(result);
    clearTimeout(popupTimer!);

    if (popupProgress) {
      popupProgress.classList.remove('animate-progress-bar');
      void popupProgress.offsetWidth;
      popupProgress.classList.add('animate-progress-bar');
    }

    popupTimer = setTimeout(hidePopup, 4000);
  }

  function hidePopup() {
    if (!popup) return;
    popup.classList.add('hidden');
    popup.classList.remove('flex');
    popup.setAttribute('data-result', '');
    if (popupTimer) clearTimeout(popupTimer);
  }

  function resetWheel() {
    currentRotation = 0;
    rotator.style.transition = 'none';
    rotator.style.transform = 'rotate(0deg)';
  }

  spinBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    spin();
  });
  spinBtn.style.cursor = 'pointer';

  addEntryBtn?.addEventListener('click', () => addEntry(entryInput?.value || ''));
  entryInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addEntry(entryInput.value);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.activeElement === questionInput) {
      spin();
    }
    if (e.key === 'Escape') hidePopup();
  });

  popup?.addEventListener('click', (e) => {
    if (e.target === popup) hidePopup();
  });

  const clearHistoryBtn = document.getElementById('clear-history') as HTMLButtonElement | null;
  clearHistoryBtn?.addEventListener('click', () => {
    clearHistory();
    renderHistory();
  });

  drawSegments(entries);
  updatePills(entries);
  renderEntryList();
  renderHistory();

  const params = new URLSearchParams(window.location.search);
  const resultParam = params.get('result');
  if (resultParam) {
    const questionParam = params.get('q') || undefined;
    setTimeout(() => showPopup(resultParam, questionParam), 500);
  }
}

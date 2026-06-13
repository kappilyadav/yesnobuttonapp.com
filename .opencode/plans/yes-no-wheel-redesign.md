# Yes No Wheel Redesign Plan

## Overview
Complete rewrite of the yes-no-wheel page with a two-column layout: left history panel + right large spinning wheel. No popup — result shows on the wheel.

## Files to modify/create

### 1. `src/scripts/wheel.ts` — Complete Rewrite

Core logic file. Exports `initWheel()`. All DOM querying, state, drawing, spin, history.

**Constants:**
```typescript
CX=200, CY=200, R=180  // SVG center and radius (400x400 viewBox)
MAX_HISTORY = 20
STORAGE_KEY = 'ynb_wheel_history'
COLORS_2 = ['#16A34A', '#DC2626']
COLORS_3 = ['#16A34A', '#DC2626', '#7C3AED']
```

**Helper functions:**
- `describeArc(startAngle, endAngle)` — SVG path string for a sector
- `centroidRadius(sweepDeg)` — `(2/3) * R * sin(s/2) / (s/2)` for label positioning
- `getSegments(mode)` — returns array of `{label, start, end, color}` using equal-angle division (180° for 2-mode, 120° for 3-mode)
- `pickRandom(mode)` — 50/50 or 33/33/33 using Math.random()
- `speakText(text)` — Web Speech API
- `getHistory()` / `saveHistory()` — localStorage

**`initWheel()` queries these DOM elements:**
- `#wheel-rotator` (SVG `<g>`, spinning group)
- `#wheel-segments` (SVG `<g>`, segment paths)
- `#wheel-labels` (SVG `<g>`, text labels)
- `#wheel-result-text` (SVG `<text>`, result word below pointer)
- `#spin-btn` (SVG `<g>`, center play button)
- `#mode-yesno`, `#mode-yesnomaybe` (toggle buttons)
- `#badge-yes`, `#badge-no`, `#badge-maybe` (result pills)
- `#history-list`, `#history-count`, `#clear-history-btn` (left panel)
- `#question-input` (text input)

**Functions inside `initWheel()`:**

| Function | Purpose |
|----------|---------|
| `drawSegments(mode)` | Clear + redraw SVG paths and labels for current mode |
| `updatePills(mode)` | Set text and visibility of result probability badges |
| `renderHistory()` | Read localStorage, render entries in #history-list |
| `addHistory(result)` | Unshift to localStorage, re-render |
| `clearHistory()` | Remove from localStorage, re-render |
| `showResultText(result)` | Set #wheel-result-text content/fill/animation |
| `hideResultText()` | Clear result text |
| `spin()` | Main spin action: pick random result, calculate rest angle, apply CSS transform transition, after 3500ms show result + add history + speak |
| `resetWheel()` | Reset rotation to 0, hide result |
| `setMode(m)` | Switch mode, redraw, reset, update toggle aria-checked |

**Spin mechanics:**
```
mid = (seg.start + seg.end) / 2
rest = (270 - mid + jitter) % 360 (jitter = +/-10°)
totalRotation += 5-8 full rotations + rest
CSS: transform 3.2s cubic-bezier(0.17, 0.67, 0.12, 0.99)
```

**Event listeners:**
- `#spin-btn` click → `spin()`
- `#mode-yesno` click → `setMode('yesno')`
- `#mode-yesnomaybe` click → `setMode('yesnomaybe')`
- `#clear-history-btn` click → `clearHistory()`
- `keydown Enter` when question input focused → `spin()`

**Segment angles (0° = right, clockwise):**
2-mode: Yes from 270°→450° (right, 180°), No from 90°→270° (left, 180°)
3-mode: Yes from 270°→390° (top-right, 120°), No from 30°→150° (bottom, 120°), Maybe from 150°→270° (left, 120°)

**History list rendering:** Each entry is a flex row with colored dot, result text, and relative timestamp ("just now", "5m ago", etc.). Alternating row backgrounds using `bg-[#FAFAF8]` / `bg-transparent`.

---

### 2. `src/components/tool/WheelSpinner.astro` — Rewrite

Larger SVG wheel with center play button. No server-side segments — all drawn by JS.

```astro
<div id="wheel-container" class="relative w-[360px] h-[360px] mx-auto" aria-hidden="true">
  <svg viewBox="0 0 400 400" class="w-full h-full" id="wheel-svg">
    <!-- Outer ring -->
    <circle cx="200" cy="200" r="194" fill="none" class="stroke-border dark:stroke-border-dark" stroke-width="6" />

    <!-- Rotating group -->
    <g id="wheel-rotator" style="transform-origin: 200px 200px;">
      <g id="wheel-segments" />
      <g id="wheel-labels" />
    </g>

    <!-- Pointer at top -->
    <polygon points="200,10 190,0 210,0" fill="currentColor" class="text-ink dark:text-ink-dark" />

    <!-- Center spin button (NOT in rotating group) -->
    <g id="spin-btn">
      <!-- Outer shadow circles -->
      <circle cx="200" cy="200" r="44" fill="rgba(0,0,0,0.15)" />
      <circle cx="200" cy="200" r="42" fill="#2563EB" />
      <!-- Play triangle -->
      <polygon points="190,180 190,220 218,200" fill="#FFFFFF" />
      <!-- Inner ring -->
      <circle cx="200" cy="200" r="38" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2" />
    </g>

    <!-- Center hub cap -->
    <circle cx="200" cy="200" r="5" fill="#1E40AF" />

    <!-- Result text below pointer -->
    <text id="wheel-result-text" x="200" y="60" text-anchor="middle" dominant-baseline="central"
          class="font-display" font-size="26" font-weight="700" fill="none">
    </text>
  </svg>
</div>
```

**CSS (`<style>` block):**
- `#wheel-container { filter: drop-shadow(...) }`
- `@keyframes wheel-spin-in { rotate(-180deg) scale(0.5) op0 → rotate(0) scale(1) op1 }`
- `#wheel-result-text { transform-origin: 200px 60px }`
- Reduced motion: `#wheel-rotator { transition: none !important }`, `#wheel-result-text { animation: none !important }`
- Hover: `#spin-btn:hover circle:nth-child(2) { fill: #1D4ED8 }`

---

### 3. `src/components/tool/WheelControls.astro` — New

Left panel card:

```astro
<div class="bg-card dark:bg-card-dark rounded-2xl shadow-sm border border-border dark:border-border-dark overflow-hidden">
  <!-- Purple header bar -->
  <div class="bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] px-5 py-3.5">
    <span class="text-white text-sm font-semibold">Yes / No</span>
  </div>

  <!-- History section -->
  <div class="p-5">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-muted dark:text-muted-dark">Decision History</h3>
      <span id="history-count" class="text-xs text-muted dark:text-muted-dark">No results yet</span>
    </div>
    <div id="history-list" class="space-y-1 max-h-[340px] overflow-y-auto">
      <!-- Populated by JS -->
    </div>
    <button id="clear-history-btn"
      class="mt-3 text-xs text-muted dark:text-muted-dark hover:text-ink dark:hover:text-ink-dark underline transition-colors cursor-pointer">
      Clear history
    </button>
  </div>
</div>
```

No JavaScript — pure template. All interaction handled by wheel.ts.

---

### 4. `src/pages/yes-no-wheel.astro` — Rewrite Hero Section

Import changes:
- Remove `import HistoryTracker` (no longer used)
- Add `import WheelControls from '../components/tool/WheelControls.astro'`

**Hero section rewritten to two-column layout:**

```astro
<section class="bg-canvas dark:bg-canvas-dark py-[80px] max-sm:py-[48px]">
  <div class="container">
    <div class="text-center mb-10">
      <h1 class="font-display text-5xl md:text-6xl font-bold text-ink dark:text-ink-dark leading-tight mb-3">
        Yes No Wheel
      </h1>
      <p class="text-muted dark:text-muted-dark leading-relaxed max-w-xl mx-auto">
        Spin the wheel for a random yes or no decision. No physical spinner needed.
      </p>
    </div>

    <!-- Two-column layout -->
    <div class="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8 items-start max-w-4xl mx-auto">
      <!-- Left: Controls -->
      <WheelControls />

      <!-- Right: Wheel + controls -->
      <div class="flex flex-col items-center gap-5">
        <WheelSpinner />

        <!-- Mode toggle -->
        <div id="mode-toggle-group" class="flex border border-border dark:border-border-dark rounded-full p-0.5" role="radiogroup">
          <button id="mode-yesno" class="mode-option px-5 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer" role="radio" aria-checked="true">Yes / No</button>
          <button id="mode-yesnomaybe" class="mode-option px-5 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer" role="radio" aria-checked="false">Yes / No / Maybe</button>
        </div>

        <!-- Result pills -->
        <div id="result-pills" class="flex items-center gap-2.5">
          <span id="badge-yes" class="px-3.5 py-1 rounded-full text-xs font-medium text-white bg-[#16A34A]">YES · 50%</span>
          <span id="badge-no" class="px-3.5 py-1 rounded-full text-xs font-medium text-white bg-[#DC2626]">NO · 50%</span>
          <span id="badge-maybe" class="px-3.5 py-1 rounded-full text-xs font-medium text-white bg-[#7C3AED] hidden">MAYBE · 33%</span>
        </div>
      </div>
    </div>

    <!-- Question input (spans full width) -->
    <div class="max-w-2xl mx-auto mt-10">
      <input id="question-input" type="text" placeholder="Type your question here (optional)"
        class="w-full px-6 py-4 rounded-2xl border border-border dark:border-border-dark bg-card dark:bg-card-dark text-ink dark:text-ink-dark text-sm placeholder:text-muted dark:placeholder:text-muted-dark focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all">
    </div>
  </div>
</section>
```

Keep all SEO content sections below (What Is, Comparison Table, How to Use, Yes No Maybe Wheel, FAQ, Internal Links) exactly as they are.

**Script block update:**
```astro
<script>
  import { initWheel } from '../scripts/wheel';
  initWheel();
</script>
```
(No more `initTool` import — this page is self-contained)

---

### 5. `src/styles/global.css` — No changes needed

Existing tokens (`yes`, `no`, `maybe`, `border`, `card`, etc.) suffice. No new CSS required.

---

### Cleanup

- `src/scripts/tool.ts` — The `hasWheel` popup-skip logic added previously is fine to keep; it won't trigger since this page no longer imports `initTool`
- `src/components/tool/ResultPopup.astro` — Untouched, still used by other pages
- `src/components/tool/HistoryTracker.astro` — Untouched, still used by other pages
- `src/components/tool/YesNoTool.astro` — Untouched, still used by other pages (`showWheel` prop can remain but won't be used on this page anymore)

---

### Responsive behavior

- Desktop (≥1024px): Two-column grid `[360px 1fr]`
- Tablet (768-1023px): Two-column grid `[300px 1fr]`
- Mobile (<768px): Single column, stacked (panel above wheel, question input at bottom)

---

### Color scheme for segments

| Mode | Segment 1 | Segment 2 | Segment 3 |
|------|-----------|-----------|-----------|
| Yes/No | Yes = `#16A34A` (green) | No = `#DC2626` (red) | — |
| Yes/No/Maybe | Yes = `#16A34A` (green) | No = `#DC2626` (red) | Maybe = `#7C3AED` (purple) |

---

### State machine

```
IDLE ──[click spin]──> SPINNING ──[3.5s timeout]──> RESULT_SHOWN ──[click spin]──> SPINNING ...
                                                      │
                                                      └── add to history → render history
                                                         speak result
                                                         show result text on wheel
```

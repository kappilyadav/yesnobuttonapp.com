# Yes No Wheel v2 — Premium Spinner Redesign

## Core Changes

### 1. `src/scripts/wheel.ts` — Major Rewrite

**Remove all history code** (getHistory, saveHistory, renderHistory, addHistory, clearHistoryFn, STORAGE_KEY, MAX_HISTORY, HistoryEntry interface, History type exports).

**State becomes entries-driven:**
```typescript
let entries: string[] = ['Yes', 'No'];
// Mode presets replace entries array
// pickRandom picks from entries by random index
// Result is a string (the entry text), not a typed enum
```

**New color palette (8 vibrant colors, cycles):**
```typescript
const SEGMENT_COLORS = [
  '#8B5CF6', // purple
  '#EC4899', // pink  
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#3B82F6', // blue
  '#06B6D4', // cyan
  '#D946EF', // magenta
];
// Each segment gets: SEGMENT_COLORS[i % SEGMENT_COLORS.length]
```

**`getSegments()` rewritten** — takes an `entries: string[]` parameter instead of mode:
```typescript
function getSegments(entries: string[]): { label: string; start: number; end: number; color: string }[] {
  const sweep = 360 / entries.length;
  return entries.map((label, i) => ({
    label: label.toUpperCase(),
    start: -90 + i * sweep,
    end: -90 + (i + 1) * sweep,
    color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
  }));
}
```

**Labels rotated to follow segment angle** — add `transform="rotate(angle, x, y)"` to each `<text>`:
```typescript
const midAngle = (seg.start + seg.end) / 2;
const rotation = midAngle - 90; // align text outward along radius
text.setAttribute('transform', `rotate(${rotation.toFixed(1)}, ${lx.toFixed(1)}, ${ly.toFixed(1)})`);
```

**`pickRandom()`** — picks a random index from entries:
```typescript
function pickRandomEntry(entries: string[]): string {
  return entries[Math.floor(Math.random() * entries.length)];
}
```

**`spin()`** — uses entries array directly, result is the entry string:
```typescript
function spin() {
  if (spinning || entries.length < 2) return;
  spinning = true;
  hideResultText();
  const result = pickRandomEntry(entries);
  const segs = getSegments(entries);
  const idx = entries.indexOf(result);
  // ... rest angle calculation same as before ...
  // After timeout:
  showResultText(result);
  addEntryToHistory(result); // keep lightweight in-memory history
  speakText(result);
}
```

**Keep in-memory history** (not localStorage) for display in a compact pill strip below the wheel:
```typescript
let recentResults: string[] = [];
function addEntryToHistory(result: string) {
  recentResults.unshift(result);
  if (recentResults.length > 10) recentResults.pop();
  renderRecentResults();
}
function renderRecentResults() { /* render pills in #recent-results container */ }
```

**`setMode(mode)`** — replaces entries array with mode preset and redraws:
```typescript
const MODE_PRESETS: Record<string, string[]> = {
  yesno: ['Yes', 'No'],
  yesnomaybe: ['Yes', 'No', 'Maybe'],
};

function setMode(m: string) {
  if (m === mode) return;
  mode = m;
  entries = [...MODE_PRESETS[m]];
  drawSegments(entries);
  updatePills(entries.length);
  renderEntryList();
  resetWheel();
  updateToggleUI();
}
```

**`renderEntryList()`** — renders the entry editor list in the left panel:
```typescript
function renderEntryList() {
  entryListEl.innerHTML = '';
  entries.forEach((entry, i) => {
    const row = document.createElement('div');
    // colored dot + label + remove button (X)
    // alternating light backgrounds
    // remove button calls removeEntry(i)
  });
  entryCountEl.textContent = `${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}`;
}
```

**`addEntry(text)`** — adds to entries, redraws wheel and list:
```typescript
function addEntry(text: string) {
  const trimmed = text.trim();
  if (!trimmed || entries.includes(trimmed)) return;
  entries.push(trimmed);
  drawSegments(entries);
  updatePills(entries.length);
  renderEntryList();
}
```

**`removeEntry(index)`** — removes from entries, redraws:
```typescript
function removeEntry(index: number) {
  if (entries.length <= 2) return; // minimum 2 entries
  entries.splice(index, 1);
  drawSegments(entries);
  updatePills(entries.length);
  renderEntryList();
}
```

**`updatePills(n)`** — dynamically shows `100/n`% per pill:
- Generate pills per entry: each gets a pill showing the entry name and `100/n`%
- Max 3 pills shown (for 2-3 entries), for more entries show just "N options" badge
- Remove the hardcoded `badge-yes`, `badge-no`, `badge-maybe` references

**New DOM elements queried:**
```typescript
const entryInput = document.getElementById('entry-input') as HTMLInputElement | null;
const addEntryBtn = document.getElementById('add-entry-btn') as HTMLButtonElement | null;
const entryList = document.getElementById('entry-list') as HTMLDivElement | null;
const entryCount = document.getElementById('entry-count') as HTMLSpanElement | null;
const recentResults = document.getElementById('recent-results') as HTMLDivElement | null;
```

**Event listeners added:**
- `addEntryBtn?.addEventListener('click', () => addEntry(entryInput?.value || ''))`
- `entryInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') addEntry(entryInput.value) })`

**Remove from `initTool()`:**
- All history-related DOM queries and calls
- `clearBtn`
- `historyList`, `historyCount`

---

### 2. `src/components/tool/WheelControls.astro` — Rewrite

Replace history panel with entry editor:

```astro
<div class="bg-card dark:bg-card-dark rounded-2xl shadow-sm border border-border dark:border-border-dark overflow-hidden">
  <!-- Purple header -->
  <div class="bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] px-5 py-3.5">
    <div class="flex items-center justify-between">
      <span class="text-white text-sm font-semibold">Entries</span>
      <span id="entry-count" class="text-white/70 text-xs font-medium">2 entries</span>
    </div>
  </div>

  <!-- Entry editor -->
  <div class="p-4 space-y-3">
    <!-- Input row -->
    <div class="flex gap-2">
      <input id="entry-input" type="text" placeholder="Add an option..."
        class="flex-1 px-3.5 py-2 rounded-xl border border-border dark:border-border-dark bg-canvas dark:bg-canvas-dark text-ink dark:text-ink-dark text-sm placeholder:text-muted dark:placeholder:text-muted-dark focus:outline-hidden focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all" />
      <button id="add-entry-btn"
        class="px-4 py-2 rounded-xl bg-[#8B5CF6] text-white text-sm font-medium hover:bg-[#7C3AED] transition-colors cursor-pointer">
        Add
      </button>
    </div>

    <!-- Entry list -->
    <div id="entry-list" class="space-y-1 max-h-[260px] overflow-y-auto">
      <!-- Populated by wheel.ts -->
    </div>

    <!-- Hint text -->
    <p class="text-xs text-muted dark:text-muted-dark">
      Add at least 2 options. Click the wheel center to spin.
    </p>
  </div>
</div>
```

---

### 3. `src/components/tool/WheelSpinner.astro` — Polish

Minor visual upgrades:
- Add a subtle glow effect behind the wheel (a radial gradient or soft shadow)
- Slightly larger wheel: `w-[380px] h-[380px]` desktop
- Thicker outer ring: `stroke-width="6"`
- Inner ring on segments: add `stroke="rgba(255,255,255,0.3)" stroke-width="1.5"` to each segment path (drawn in JS)
- Pointer: add a small circle at the base for a more polished look
- Play button: add a subtle ripple/glow on hover
- Result text: position slightly lower (`y="65"`) and larger (`font-size="28"`)

---

### 4. `src/pages/yes-no-wheel.astro` — Layout & Spacing

**Hero section refinements:**
- Smaller title: `text-4xl md:text-5xl` (down from `text-5xl md:text-6xl`)
- Less padding on hero: `py-[60px] max-sm:py-[40px]`
- Grid proportion: `lg:grid-cols-[320px_1fr]` (narrower left panel)
- Gap: `gap-10` for more breathing room

**Below the wheel, improved controls area:**
```
[Mode Toggle - centered]
[Result Pills - centered]
[Recent Results row - compact pill strip]
```

**Result pills replaced with dynamic version:**
Remove the hardcoded `badge-yes`, `badge-no`, `badge-maybe` HTML. Instead, render a `#result-pills` container that `wheel.ts` populates dynamically based on current entries:

```html
<div id="result-pills" class="flex items-center justify-center gap-2 flex-wrap min-h-[32px]">
  <!-- Populated by wheel.ts -->
</div>
```

**Add recent results strip:**
```html
<div id="recent-results" class="flex items-center justify-center gap-1.5 min-h-[28px]">
  <!-- Populated by wheel.ts - small pill badges of recent spins -->
</div>
```

**Question input unchanged** but with slightly refined styling.

**Move the mode toggle and pills into a visually grouped card:**
```html
<div class="flex flex-col items-center gap-3 bg-card dark:bg-card-dark rounded-2xl border border-border dark:border-border-dark p-4 w-full max-w-md">
  <div id="mode-toggle-group" class="flex ...">
    ...
  </div>
  <div id="result-pills" class="flex ...">
    ...
  </div>
  <div id="recent-results" class="flex ...">
    ...
  </div>
</div>
```

This groups the controls into a neat card below the wheel, making the interaction area feel intentional and polished.

---

### Summary of file changes:

| File | Change |
|------|--------|
| `src/scripts/wheel.ts` | Rewrite: entries-based segments, vibrant palette (8 colors), rotated labels, in-memory results, entry add/remove, dynamic pills |
| `src/components/tool/WheelControls.astro` | Rewrite: entry editor instead of history panel |
| `src/components/tool/WheelSpinner.astro` | Polish: larger, thicker ring, subtle glow, improved pointer |
| `src/pages/yes-no-wheel.astro` | Layout: narrower left panel, grouped controls card below wheel, smaller title, dynamic result pills |

### Color palette (8 vibrant colors):

```
#8B5CF6  Purple (vivid violet)
#EC4899  Pink
#F97316  Orange
#EAB308  Yellow  
#22C55E  Green
#3B82F6  Blue
#06B6D4  Cyan
#D946EF  Magenta
```

type Theme = 'light' | 'dark' | 'system';

let mediaQuery: MediaQueryList | null = null;
let changeHandler: (() => void) | null = null;

export function getStoredTheme(): Theme | null {
  const stored = localStorage.getItem('theme') as Theme | null;
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  return null;
}

export function getEffectiveTheme(): 'light' | 'dark' {
  const stored = getStoredTheme();
  if (stored === 'light') return 'light';
  if (stored === 'dark') return 'dark';
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeClass(theme: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function setTheme(theme: Theme) {
  localStorage.setItem('theme', theme);

  if (mediaQuery && changeHandler) {
    mediaQuery.removeEventListener('change', changeHandler);
    mediaQuery = null;
    changeHandler = null;
  }

  if (theme === 'system') {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    applyThemeClass(mq.matches ? 'dark' : 'light');
    const handler = () => {
      applyThemeClass(mq.matches ? 'dark' : 'light');
      document.dispatchEvent(new CustomEvent('themechange', { detail: getEffectiveTheme() }));
    };
    mq.addEventListener('change', handler);
    mediaQuery = mq;
    changeHandler = handler;
  } else {
    applyThemeClass(theme);
  }

  document.dispatchEvent(new CustomEvent('themechange', { detail: getEffectiveTheme() }));
}

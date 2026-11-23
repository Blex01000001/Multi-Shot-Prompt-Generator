// =============================================================================
// theme.js — light / dark theme. Loaded in <head> (right after the Tailwind
// config) and applies the saved theme immediately, so the page never flashes
// the wrong colors. The colors themselves are CSS variables in css/style.css;
// the toggle button is wired in app.js (initTheme).
// =============================================================================

const THEME_STORAGE_KEY = 'msp-theme'; // 'dark' (default) | 'light'
const THEME_COLORS = { dark: '#0f172a', light: '#f8fafc' }; // <meta name="theme-color">

function loadTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark';
  } catch (e) { return 'dark'; }
}

function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (e) { /* ignore */ }
}

function currentTheme() {
  return document.documentElement.classList.contains('light') ? 'light' : 'dark';
}

function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.toggle('light', theme === 'light');
  root.classList.toggle('dark', theme !== 'light');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_COLORS[theme === 'light' ? 'light' : 'dark']);
}

applyTheme(loadTheme()); // on purpose at load time: avoids a flash of the wrong theme

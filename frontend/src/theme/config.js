/** Theme metadata — CSS variables live in themes.css */
export const DEFAULT_THEME_ID = 'gold';

export const THEME_IDS = ['light', 'dark', 'midnight', 'emerald', 'purple', 'sunset', 'rose', 'gold'];

export const THEMES = {
  light: {
    id: 'light',
    label: 'Light',
    accent: '#2563eb',
    preview: ['#f8fafc', '#2563eb', '#e2e8f0'],
  },
  dark: {
    id: 'dark',
    label: 'Dark',
    accent: '#60a5fa',
    preview: ['#0f172a', '#60a5fa', '#1e293b'],
  },
  midnight: {
    id: 'midnight',
    label: 'Midnight Blue',
    accent: '#38bdf8',
    preview: ['#0c1929', '#38bdf8', '#1e3a5f'],
  },
  emerald: {
    id: 'emerald',
    label: 'Emerald',
    accent: '#10b981',
    preview: ['#ecfdf5', '#10b981', '#d1fae5'],
  },
  purple: {
    id: 'purple',
    label: 'Purple',
    accent: '#a855f7',
    preview: ['#faf5ff', '#a855f7', '#ede9fe'],
  },
  sunset: {
    id: 'sunset',
    label: 'Sunset Orange',
    accent: '#f97316',
    preview: ['#fff7ed', '#f97316', '#ffedd5'],
  },
  rose: {
    id: 'rose',
    label: 'Rose Pink',
    accent: '#f43f5e',
    preview: ['#fff1f2', '#f43f5e', '#ffe4e6'],
  },
  gold: {
    id: 'gold',
    label: 'Premium Gold',
    accent: '#D4AF37',
    preview: ['#0B0B0B', '#D4AF37', '#1E1E1E'],
  },
};

export const THEME_LIST = THEME_IDS.map((id) => THEMES[id]);

export const STORAGE_KEY = 'linkforge-theme';

export const getStoredTheme = () => {
  if (typeof window === 'undefined') return DEFAULT_THEME_ID;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return DEFAULT_THEME_ID;
  return THEME_IDS.includes(stored) ? stored : DEFAULT_THEME_ID;
};

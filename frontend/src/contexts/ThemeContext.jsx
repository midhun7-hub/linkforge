import { createContext, useContext, useEffect, useState } from 'react';
import { THEMES, THEME_LIST, STORAGE_KEY, DEFAULT_THEME_ID, getStoredTheme } from '../theme/config';

const ThemeContext = createContext(null);

export { THEMES, THEME_LIST, STORAGE_KEY };

export const ThemeProvider = ({ children }) => {
  const [themeId, setThemeId] = useState(getStoredTheme);
  const theme = THEMES[themeId] || THEMES[DEFAULT_THEME_ID];

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeId);
    localStorage.setItem(STORAGE_KEY, themeId);
    document.documentElement.style.colorScheme =
      themeId === 'dark' || themeId === 'midnight' || themeId === 'gold' ? 'dark' : 'light';
  }, [themeId]);

  const setTheme = (id) => {
    if (THEMES[id]) setThemeId(id);
  };

  const value = {
    themeId,
    theme,
    setTheme,
    themes: THEME_LIST,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

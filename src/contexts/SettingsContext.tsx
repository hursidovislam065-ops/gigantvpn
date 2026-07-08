import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SettingsContextType {
  theme: 'dark' | 'light';
  fontSize: 'small' | 'medium' | 'large';
  language: 'ru' | 'en';
  setTheme: (t: 'dark' | 'light') => void;
  setFontSize: (s: 'small' | 'medium' | 'large') => void;
  setLanguage: (l: 'ru' | 'en') => void;
}

const SettingsContext = createContext<SettingsContextType>({
  theme: 'dark',
  fontSize: 'medium',
  language: 'ru',
  setTheme: () => {},
  setFontSize: () => {},
  setLanguage: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => (localStorage.getItem('theme') as 'dark' | 'light') || 'dark');
  const [fontSize, setFontSizeState] = useState<'small' | 'medium' | 'large'>(() => (localStorage.getItem('fontSize') as 'small' | 'medium' | 'large') || 'medium');
  const [language, setLanguageState] = useState<'ru' | 'en'>(() => (localStorage.getItem('language') as 'ru' | 'en') || 'ru');

  const setTheme = (t: 'dark' | 'light') => {
    setThemeState(t);
    localStorage.setItem('theme', t);
  };

  const setFontSize = (s: 'small' | 'medium' | 'large') => {
    setFontSizeState(s);
    localStorage.setItem('fontSize', s);
  };

  const setLanguage = (l: 'ru' | 'en') => {
    setLanguageState(l);
    localStorage.setItem('language', l);
  };

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.style.setProperty('--bg-primary', '#f5f5f7');
      root.style.setProperty('--bg-secondary', '#e8e8ed');
      root.style.setProperty('--bg-tertiary', '#d1d1d6');
      root.style.setProperty('--text-primary', '#1d1d1f');
      root.style.setProperty('--text-secondary', '#6e6e73');
      root.style.setProperty('--text-muted', '#86868b');
      document.body.style.background = '#f5f5f7';
      document.body.style.color = '#1d1d1f';
      root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.7)');
      root.style.setProperty('--glass-border', 'rgba(0, 0, 0, 0.08)');
    } else {
      root.style.setProperty('--bg-primary', '#050810');
      root.style.setProperty('--bg-secondary', '#0A0E1A');
      root.style.setProperty('--bg-tertiary', '#0F1420');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#8B95A7');
      root.style.setProperty('--text-muted', '#6E7A8A');
      document.body.style.background = '#050810';
      document.body.style.color = '#ffffff';
      root.style.setProperty('--glass-bg', 'rgba(19, 24, 38, 0.7)');
      root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.06)');
    }
  }, [theme]);

  // Apply font size
  useEffect(() => {
    const sizes = { small: '13px', medium: '15px', large: '17px' };
    document.documentElement.style.fontSize = sizes[fontSize];
  }, [fontSize]);

  return (
    <SettingsContext.Provider value={{ theme, fontSize, language, setTheme, setFontSize, setLanguage }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

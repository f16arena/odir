import React, { createContext, useContext, useState, useEffect } from 'react';
import { getLang, setLang as saveLang, translations } from './i18n';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [lang, setLangState] = useState(getLang);

  useEffect(() => {
    localStorage.setItem('theme', dark ? 'dark' : 'light');
    const themeColors = colors(dark);
    document.body.style.background = themeColors.bg;
    document.body.style.color = themeColors.text;
    document.body.style.transition = 'background 0.2s ease, color 0.2s ease';
  }, [dark]);

  const toggleDark = () => setDark(d => !d);
  const setLang = (l) => {
    saveLang(l);
    setLangState(l);
  };
  const tr = translations[lang] || translations.ru;

  return (
    <ThemeContext.Provider value={{ dark, toggleDark, lang, setLang, tr }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

export const colors = (dark) => ({
  bg:          dark ? '#0f0f13' : '#f8f9fc',
  bgCard:      dark ? '#1a1c23' : '#ffffff',
  bgSidebar:   dark ? '#121318' : '#ffffff',
  bgHover:     dark ? '#252832' : '#f1f3f8',
  
  border:      dark ? '#2a2c35' : '#e9ecf2',
  borderLight: dark ? '#1f2128' : '#f0f2f6',
  
  text:        dark ? '#edf2f7' : '#1e293b',
  textMuted:   dark ? '#9ca3af' : '#64748b',
  textLight:   dark ? '#6b7280' : '#94a3b8',
  
  inputBg:     dark ? '#1e2028' : '#ffffff',
  inputBorder: dark ? '#2d2f38' : '#cbd5e1',
  inputFocus:  dark ? '#3b82f6' : '#3b82f6',
  
  shadowSm:    dark ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.05)',
  shadowMd:    dark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.05)',
  shadowLg:    dark ? '0 8px 24px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.08)',
  
  accent:      dark ? '#3b82f6' : '#2563eb',
  accentHover: dark ? '#60a5fa' : '#1d4ed8',
  success:     dark ? '#10b981' : '#059669',
  warning:     dark ? '#f59e0b' : '#d97706',
  error:       dark ? '#ef4444' : '#dc2626',
  
  grad1: dark ? 'linear-gradient(135deg, #1e293b, #0f172a)' : 'linear-gradient(135deg, #f1f5f9, #ffffff)',
  grad2: dark ? 'linear-gradient(135deg, #1e293b, #0f172a)' : 'linear-gradient(135deg, #f1f5f9, #ffffff)',
  grad3: dark ? 'linear-gradient(135deg, #1e293b, #0f172a)' : 'linear-gradient(135deg, #f1f5f9, #ffffff)',
  grad4: dark ? 'linear-gradient(135deg, #1e293b, #0f172a)' : 'linear-gradient(135deg, #f1f5f9, #ffffff)',
});
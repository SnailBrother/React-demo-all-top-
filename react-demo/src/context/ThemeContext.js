import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const THEME_PRESETS = {
    light: { primaryColor: '#3b82f6', fontSize: 14 },
    dark: { primaryColor: '#60a5fa', fontSize: 14 },
    female: { primaryColor: '#ec4899', fontSize: 15 }, // 适合女生：玫红
    male: { primaryColor: '#2563eb', fontSize: 14 },   // 适合男生：深蓝
    middle: { primaryColor: '#8b5e34', fontSize: 16 }, // 适合中年人：棕铜
  };
  const [theme, setTheme] = useState('light');
  const [settings, setSettings] = useState({
    primaryColor: '#3b82f6',
    fontSize: 14,
    backgroundImage: '', // data URL
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center center',
  });

  useEffect(() => {
    // 从 localStorage 或系统偏好获取主题
    const savedTheme = localStorage.getItem('theme');
    const savedSettings = localStorage.getItem('themeSettings');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    
    const initialTheme = savedTheme || systemTheme;
    setTheme(initialTheme);
    if (savedSettings) {
      try { setSettings(JSON.parse(savedSettings)); } catch {}
    }
    
    // 应用主题到文档
    document.documentElement.setAttribute('data-theme', initialTheme);
    document.documentElement.classList.add(initialTheme);
    applySettingsToDocument(savedSettings ? JSON.parse(savedSettings) : undefined);
  }, []);

  const applySettingsToDocument = (s) => {
    const next = s || settings;
    const root = document.documentElement;
    root.style.setProperty('--color-primary', next.primaryColor);
    root.style.setProperty('--font-size-base', `${next.fontSize}px`);
    document.body.style.backgroundImage = next.backgroundImage ? `url(${next.backgroundImage})` : '';
    document.body.style.backgroundSize = next.backgroundSize;
    document.body.style.backgroundRepeat = next.backgroundRepeat;
    document.body.style.backgroundPosition = next.backgroundPosition;
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // 更新文档主题
    document.documentElement.setAttribute('data-theme', newTheme);
    document.documentElement.classList.remove(theme);
    document.documentElement.classList.add(newTheme);
  };

  const changeTheme = (newTheme) => {
    if (newTheme !== theme) {
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
      
      // 更新文档主题
      document.documentElement.setAttribute('data-theme', newTheme);
      document.documentElement.classList.remove(theme);
      document.documentElement.classList.add(newTheme);
      // 应用预设（如果存在）
      const preset = THEME_PRESETS[newTheme];
      if (preset) {
        updateSettings(preset);
      }
    }
  };

  const updateSettings = (partial) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      localStorage.setItem('themeSettings', JSON.stringify(next));
      // 应用到文档
      setTimeout(() => applySettingsToDocument(next), 0);
      return next;
    });
  };

  const value = {
    theme,
    toggleTheme,
    changeTheme,
    isDark: theme === 'dark',
    settings,
    updateSettings,
    themes: ['light', 'dark', 'female', 'male', 'middle']
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// 自定义 Hook
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
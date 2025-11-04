import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const THEME_PRESETS = {
    light: { 
      primaryColor: '#3b82f6', 
      fontSize: 14,
      bgColor: '#ffffff',
      surfaceColor: '#f8f9fa',
      textColor: '#212529',
      textMuted: '#6c757d',
      borderColor: '#dee2e6'
    },
    dark: { 
      primaryColor: '#60a5fa', 
      fontSize: 14,
      bgColor: '#121212',
      surfaceColor: '#1e1e1e',
      textColor: '#e9ecef',
      textMuted: '#adb5bd',
      borderColor: '#495057'
    },
    female: { 
      primaryColor: '#ec4899', 
      fontSize: 15,
      bgColor: '#fdf2f8',
      surfaceColor: '#fce7f3',
      textColor: '#831843',
      textMuted: '#be185d',
      borderColor: '#fbcfe8'
    },
    male: { 
      primaryColor: '#2563eb', 
      fontSize: 14,
      bgColor: '#f0f9ff',
      surfaceColor: '#e0f2fe',
      textColor: '#0c4a6e',
      textMuted: '#0369a1',
      borderColor: '#bae6fd'
    },
    middle: { 
      primaryColor: '#8b5e34', 
      fontSize: 16,
      bgColor: '#fefce8',
      surfaceColor: '#fef9c3',
      textColor: '#713f12',
      textMuted: '#a16207',
      borderColor: '#fde68a'
    },
  };

  const [theme, setTheme] = useState('light');
  const [settings, setSettings] = useState({
    primaryColor: '#3b82f6',
    fontSize: 14,
    backgroundImage: '',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center center',
    bgColor: '#ffffff',
    surfaceColor: '#f8f9fa',
    textColor: '#212529',
    textMuted: '#6c757d',
    borderColor: '#dee2e6'
  });

  // 添加自定义主题状态
  const [customThemes, setCustomThemes] = useState({});
  const [currentCustomTheme, setCurrentCustomTheme] = useState(null);

  useEffect(() => {
    // 从 localStorage 获取数据
    const savedTheme = localStorage.getItem('theme');
    const savedSettings = localStorage.getItem('themeSettings');
    const savedCustomThemes = localStorage.getItem('customThemes');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    
    const initialTheme = savedTheme || systemTheme;
    setTheme(initialTheme);
    
    if (savedSettings) {
      try { 
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch {}
    }
    
    if (savedCustomThemes) {
      try {
        setCustomThemes(JSON.parse(savedCustomThemes));
      } catch {}
    }
    
    // 应用主题到文档
    document.documentElement.setAttribute('data-theme', initialTheme);
    document.documentElement.classList.add(initialTheme);
    applySettingsToDocument(savedSettings ? JSON.parse(savedSettings) : undefined);
  }, []);

  const applySettingsToDocument = (s) => {
    const next = s || settings;
    const root = document.documentElement;
    
    // 应用 CSS 变量
    root.style.setProperty('--color-primary', next.primaryColor);
    root.style.setProperty('--font-size-base', `${next.fontSize}px`);
    root.style.setProperty('--bg-color', next.bgColor);
    root.style.setProperty('--surface-color', next.surfaceColor);
    root.style.setProperty('--text-color', next.textColor);
    root.style.setProperty('--text-muted', next.textMuted);
    root.style.setProperty('--border-color', next.borderColor);
    
    // 应用背景图片
    document.body.style.backgroundImage = next.backgroundImage ? `url(${next.backgroundImage})` : '';
    document.body.style.backgroundSize = next.backgroundSize;
    document.body.style.backgroundRepeat = next.backgroundRepeat;
    document.body.style.backgroundPosition = next.backgroundPosition;
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    setCurrentCustomTheme(null); // 切换预设主题时清除自定义主题
    localStorage.setItem('theme', newTheme);
    
    // 更新文档主题
    document.documentElement.setAttribute('data-theme', newTheme);
    document.documentElement.classList.remove(theme);
    document.documentElement.classList.add(newTheme);
    
    // 应用预设
    const preset = THEME_PRESETS[newTheme];
    if (preset) {
      updateSettings(preset);
    }
  };

  const changeTheme = (newTheme) => {
    if (newTheme !== theme) {
      setTheme(newTheme);
      setCurrentCustomTheme(null); // 切换预设主题时清除自定义主题
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

  // 自定义主题相关方法
  const saveCustomTheme = (themeName, themeData) => {
    const newTheme = {
      name: themeName,
      settings: { ...themeData },
      createdAt: new Date().toISOString(),
      isCustom: true
    };
    
    setCustomThemes(prev => ({
      ...prev,
      [themeName]: newTheme
    }));
    
    localStorage.setItem('customThemes', JSON.stringify({
      ...customThemes,
      [themeName]: newTheme
    }));
    
    setCurrentCustomTheme(themeName);
    applyCustomThemeSettings(themeData);
    return newTheme;
  };

  const applyCustomTheme = (themeName) => {
    if (customThemes[themeName]) {
      setCurrentCustomTheme(themeName);
      applyCustomThemeSettings(customThemes[themeName].settings);
      // 更新主设置但不保存到预设
      setSettings(prev => ({ ...prev, ...customThemes[themeName].settings }));
    }
  };

  const deleteCustomTheme = (themeName) => {
    setCustomThemes(prev => {
      const newThemes = { ...prev };
      delete newThemes[themeName];
      localStorage.setItem('customThemes', JSON.stringify(newThemes));
      return newThemes;
    });
    
    if (currentCustomTheme === themeName) {
      setCurrentCustomTheme(null);
      // 回退到 light 主题
      changeTheme('light');
    }
  };

  const updateCustomTheme = (themeName, updatedSettings) => {
    setCustomThemes(prev => {
      const updated = {
        ...prev,
        [themeName]: {
          ...prev[themeName],
          settings: { ...prev[themeName].settings, ...updatedSettings }
        }
      };
      localStorage.setItem('customThemes', JSON.stringify(updated));
      return updated;
    });

    // 如果当前正在应用这个主题，立即更新
    if (currentCustomTheme === themeName) {
      applyCustomThemeSettings(updatedSettings);
      setSettings(prev => ({ ...prev, ...updatedSettings }));
    }
  };

  const applyCustomThemeSettings = (themeSettings) => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', themeSettings.primaryColor);
    root.style.setProperty('--font-size-base', `${themeSettings.fontSize}px`);
    root.style.setProperty('--bg-color', themeSettings.bgColor);
    root.style.setProperty('--surface-color', themeSettings.surfaceColor);
    root.style.setProperty('--text-color', themeSettings.textColor);
    root.style.setProperty('--text-muted', themeSettings.textMuted);
    root.style.setProperty('--border-color', themeSettings.borderColor);
  };

  const value = {
    theme,
    toggleTheme,
    changeTheme,
    isDark: theme === 'dark',
    settings,
    updateSettings,
    themes: ['light', 'dark', 'female', 'male', 'middle'],
    // 自定义主题相关
    customThemes,
    currentCustomTheme,
    saveCustomTheme,
    applyCustomTheme,
    deleteCustomTheme,
    updateCustomTheme,
    THEME_PRESETS
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
// src/context/ThemeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext();

// 默认主题配置 - 使用新的变量名
const DEFAULT_THEME = {
  // 背景色
  'background-color': '#FFFFFFFF',
  'secondary-background-color': '#F8F9FAFF',
  'hover_background-color': '#E9ECEEFF',
  'focus_background-color': '#DEE2E6FF',
  
  // 字体颜色
  'font-color': '#000000FF',
  'secondary-font-color': '#6C757DFF',
  'hover_font-color': '#0078D4FF',
  'focus_font-color': '#0056B3FF',
  'watermark-font-color': '#B3B5B6FF',
  'font-family': 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  
  // 边框颜色
  'border_color': '#DEE2E6FF',
  'secondary-border_color': '#E9ECEEFF',
  'hover_border_color': '#0078D4FF',
  'focus_border_color': '#0056B3FF',
  
  // 阴影颜色
  'shadow_color': '#00000019',
  'hover_shadow_color': '#00000026',
  'focus_shadow_color': '#0078D440'
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('default');
  const [customThemes, setCustomThemes] = useState({});
  const [previewTheme, setPreviewTheme] = useState(null);

  // 应用主题到 :root
  const applyThemeToRoot = (theme) => {
    const root = document.documentElement;
    
    // 移除之前的自定义主题属性
    root.removeAttribute('data-custom-theme');
    root.removeAttribute('data-preview-theme');
    
    if (theme === 'default') {
      // 应用默认主题
      root.setAttribute('data-theme', 'default');
      Object.keys(DEFAULT_THEME).forEach(key => {
        const cssVarName = `--${key}`;
        root.style.setProperty(cssVarName, DEFAULT_THEME[key]);
      });
    } else if (typeof theme === 'string' && customThemes[theme]) {
      // 应用已保存的自定义主题
      root.setAttribute('data-custom-theme', theme);
      const themeData = customThemes[theme];
      Object.keys(themeData).forEach(key => {
        if (key !== 'name' && key !== 'createdAt' && key !== 'updatedAt') {
          const cssVarName = `--${key}`;
          root.style.setProperty(cssVarName, themeData[key]);
        }
      });
    } else if (typeof theme === 'object') {
      // 实时预览主题
      root.setAttribute('data-preview-theme', 'true');
      Object.keys(theme).forEach(key => {
        const cssVarName = `--${key}`;
        root.style.setProperty(cssVarName, theme[key]);
      });
    }
  };

  // 实时预览主题
  const previewThemeSettings = (themeSettings) => {
    setPreviewTheme(themeSettings);
    applyThemeToRoot(themeSettings);
  };

  // 取消预览，恢复当前主题
  const cancelPreview = () => {
    setPreviewTheme(null);
    applyThemeToRoot(currentTheme === 'default' ? 'default' : customThemes[currentTheme]);
  };

  // 初始化应用默认主题
  useEffect(() => {
    applyThemeToRoot('default');
    
    // 加载保存的自定义主题
    const savedThemes = localStorage.getItem('customThemes');
    if (savedThemes) {
      setCustomThemes(JSON.parse(savedThemes));
    }
  }, []);

  // 保存自定义主题
  const saveCustomTheme = (name, settings) => {
    const newTheme = {
      ...settings,
      name,
      createdAt: new Date().toISOString()
    };
    
    const updatedThemes = {
      ...customThemes,
      [name]: newTheme
    };
    
    setCustomThemes(updatedThemes);
    localStorage.setItem('customThemes', JSON.stringify(updatedThemes));
    
    // 保存后应用该主题
    applyCustomTheme(name);
  };

  // 应用自定义主题
  const applyCustomTheme = (name) => {
    setCurrentTheme(name);
    setPreviewTheme(null);
    if (name === 'default') {
      applyThemeToRoot('default');
    } else if (customThemes[name]) {
      applyThemeToRoot(customThemes[name]);
    }
  };

  // 更新自定义主题
  const updateCustomTheme = (name, settings) => {
    if (customThemes[name]) {
      const updatedThemes = {
        ...customThemes,
        [name]: {
          ...settings,
          name,
          updatedAt: new Date().toISOString()
        }
      };
      
      setCustomThemes(updatedThemes);
      localStorage.setItem('customThemes', JSON.stringify(updatedThemes));
      
      // 如果当前正在使用这个主题，重新应用
      if (currentTheme === name) {
        applyThemeToRoot(updatedThemes[name]);
      }
    }
  };

  // 删除自定义主题
  const deleteCustomTheme = (name) => {
    const updatedThemes = { ...customThemes };
    delete updatedThemes[name];
    
    setCustomThemes(updatedThemes);
    localStorage.setItem('customThemes', JSON.stringify(updatedThemes));
    
    // 如果删除的是当前主题，回退到默认主题
    if (currentTheme === name) {
      applyCustomTheme('default');
    }
  };

  // 重置为默认主题
  const resetToDefault = () => {
    applyCustomTheme('default');
  };

  const value = {
    currentTheme,
    customThemes,
    previewTheme,
    themeSettings: DEFAULT_THEME,
    saveCustomTheme,
    applyCustomTheme,
    updateCustomTheme,
    deleteCustomTheme,
    previewThemeSettings,
    cancelPreview,
    resetToDefault
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
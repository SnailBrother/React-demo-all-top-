// context/ThemeContext.js
import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeSettings, setThemeSettings] = useState({});
  const [defaultTheme, setDefaultTheme] = useState({
    'background-color': '#ffffff',
    'secondary-background-color': '#f5f5f5',
    'hover_background-color': '#e6f7ff',
    'focus_background-color': '#1890ff',
    'font-color': '#000000',
    'secondary-font-color': '#666666',
    'hover_font-color': '#1890ff',
    'focus_font-color': '#ffffff',
    'watermark-font-color': '#cccccc',
    'font-family': 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    'border_color': '#d9d9d9',
    'secondary-border_color': '#f0f0f0',
    'hover_border_color': '#1890ff',
    'focus_border_color': '#1890ff',
    'shadow_color': 'rgba(0, 0, 0, 0.1)',
    'hover_shadow_color': 'rgba(24, 144, 255, 0.3)',
    'focus_shadow_color': 'rgba(24, 144, 255, 0.5)'
  });
  const [previewTheme, setPreviewTheme] = useState(null);
  const [allThemes, setAllThemes] = useState([]);
  const [activeTheme, setActiveTheme] = useState(null);
  const [loading, setLoading] = useState(true); // 初始化为 true，表示正在加载
  const [themeInitialized, setThemeInitialized] = useState(false); // 新增：主题初始化完成标志

  // 立即应用默认主题，确保页面有基础样式
  useEffect(() => {
    applyThemeToRoot(defaultTheme);
  }, []);

  // 页面加载时从本地存储恢复主题 - 使用同步方式立即执行
  useEffect(() => {
    const initializeTheme = () => {
      try {
        console.log('开始初始化主题...');
        const savedTheme = localStorage.getItem('activeTheme');
        
        if (savedTheme) {
          const theme = JSON.parse(savedTheme);
          console.log('从本地存储恢复主题:', theme);
          setActiveTheme(theme);
          applyThemeToRoot(transformDbThemeToCss(theme));
        } else {
          console.log('未找到保存的主题，使用默认主题');
          // 确保默认主题被应用
          applyThemeToRoot(defaultTheme);
        }
      } catch (error) {
        console.error('恢复主题失败:', error);
        localStorage.removeItem('activeTheme');
        // 确保即使出错也有默认主题
        applyThemeToRoot(defaultTheme);
      } finally {
        // 设置加载完成状态
        setLoading(false);
        setThemeInitialized(true);
        console.log('主题初始化完成');
      }
    };

    // 立即执行初始化
    initializeTheme();
  }, []); // 空依赖数组，确保只在组件挂载时执行一次

  // 当 activeTheme 变化时保存到本地存储
  useEffect(() => {
    if (activeTheme && themeInitialized) {
      localStorage.setItem('activeTheme', JSON.stringify(activeTheme));
      console.log('主题已保存到本地存储:', activeTheme);
    }
  }, [activeTheme, themeInitialized]);

  // 更新主题设置
  const updateThemeSettings = useCallback((newSettings) => {
    setThemeSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // 预览主题设置
  const previewThemeSettings = useCallback((previewSettings) => {
    setPreviewTheme(previewSettings);
    applyThemeToRoot(previewSettings);
  }, []);

  // 取消预览
  const cancelPreview = useCallback(() => {
    setPreviewTheme(null);
    if (activeTheme) {
      applyThemeToRoot(transformDbThemeToCss(activeTheme));
    } else {
      applyThemeToRoot(defaultTheme);
    }
  }, [activeTheme, defaultTheme]);

  // 应用主题到根元素
  const applyThemeToRoot = useCallback((settings) => {
    const root = document.documentElement;
    console.log('应用主题到根元素:', settings);
    
    Object.entries(settings).forEach(([key, value]) => {
      if (value) {
        const cssVarName = `--${key.replace(/_/g, '-')}`;
        root.style.setProperty(cssVarName, value);
        console.log(`设置 CSS 变量: ${cssVarName} = ${value}`);
      }
    });
  }, []);

  // 数据库主题转CSS变量格式
  const transformDbThemeToCss = useCallback((dbTheme) => {
    if (!dbTheme) return defaultTheme;
    
    const transformed = {
      'background-color': dbTheme.background_color || defaultTheme['background-color'],
      'secondary-background-color': dbTheme.secondary_background_color || defaultTheme['secondary-background-color'],
      'hover_background-color': dbTheme.hover_background_color || defaultTheme['hover_background-color'],
      'focus_background-color': dbTheme.focus_background_color || defaultTheme['focus_background-color'],
      'font-color': dbTheme.font_color || defaultTheme['font-color'],
      'secondary-font-color': dbTheme.secondary_font_color || defaultTheme['secondary-font-color'],
      'hover_font-color': dbTheme.hover_font_color || defaultTheme['hover_font-color'],
      'focus_font-color': dbTheme.focus_font_color || defaultTheme['focus_font-color'],
      'watermark-font-color': dbTheme.watermark_font_color || defaultTheme['watermark-font-color'],
      'font-family': dbTheme.font_family || defaultTheme['font-family'],
      'border_color': dbTheme.border_color || defaultTheme['border_color'],
      'secondary-border_color': dbTheme.secondary_border_color || defaultTheme['secondary-border_color'],
      'hover_border_color': dbTheme.hover_border_color || defaultTheme['hover_border_color'],
      'focus_border_color': dbTheme.focus_border_color || defaultTheme['focus_border_color'],
      'shadow_color': dbTheme.shadow_color || defaultTheme['shadow_color'],
      'hover_shadow_color': dbTheme.hover_shadow_color || defaultTheme['hover_shadow_color'],
      'focus_shadow_color': dbTheme.focus_shadow_color || defaultTheme['focus_shadow_color'],
      'background-animation': dbTheme.background_animation || 'WaterWave'
    };
    
    console.log('转换数据库主题到CSS:', dbTheme, '->', transformed);
    return transformed;
  }, [defaultTheme]);

  // CSS变量格式转数据库主题
  const transformCssToDbTheme = useCallback((cssTheme) => {
    return {
      background_color: cssTheme['background-color'],
      secondary_background_color: cssTheme['secondary-background-color'],
      hover_background_color: cssTheme['hover_background-color'],
      focus_background_color: cssTheme['focus_background-color'],
      font_color: cssTheme['font-color'],
      secondary_font_color: cssTheme['secondary-font-color'],
      hover_font_color: cssTheme['hover_font-color'],
      focus_font_color: cssTheme['focus_font-color'],
      watermark_font_color: cssTheme['watermark-font-color'],
      font_family: cssTheme['font-family'],
      border_color: cssTheme['border_color'],
      secondary_border_color: cssTheme['secondary-border_color'],
      hover_border_color: cssTheme['hover_border_color'],
      focus_border_color: cssTheme['focus_border_color'],
      shadow_color: cssTheme['shadow_color'],
      hover_shadow_color: cssTheme['hover_shadow_color'],
      focus_shadow_color: cssTheme['focus_shadow_color'],
      background_animation: cssTheme['background-animation']
    };
  }, []);

  // 更新主题列表
  const updateThemes = useCallback((themes) => {
    setAllThemes(themes);
  }, []);

  // 更新活动主题
  const updateActiveTheme = useCallback((theme) => {
    console.log('更新活动主题:', theme);
    setActiveTheme(theme);
    if (theme) {
      const cssTheme = transformDbThemeToCss(theme);
      applyThemeToRoot(cssTheme);
      // 自动保存到本地存储
      localStorage.setItem('activeTheme', JSON.stringify(theme));
    } else {
      // 如果没有主题，清除本地存储并应用默认主题
      localStorage.removeItem('activeTheme');
      applyThemeToRoot(defaultTheme);
    }
  }, [applyThemeToRoot, transformDbThemeToCss, defaultTheme]);

  // 设置加载状态
  const setLoadingState = useCallback((isLoading) => {
    setLoading(isLoading);
  }, []);

  const value = {
    themeSettings,
    defaultTheme,
    previewTheme,
    allThemes,
    activeTheme,
    loading,
    themeInitialized, // 暴露初始化状态
    updateThemeSettings,
    previewThemeSettings,
    cancelPreview,
    transformDbThemeToCss,
    transformCssToDbTheme,
    applyThemeToRoot,
    setDefaultTheme,
    updateThemes,
    updateActiveTheme,
    setLoadingState
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
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { apiClient } from '../utils';

const ThemeContext = createContext();

// 默认主题配置 - 作为最终回退
const DEFAULT_THEME = {
  'background-color': '#FFFFFFFF',
  'secondary-background-color': '#F8F9FAFF',
  'hover_background-color': '#E9ECEEFF',
  'focus_background-color': '#DEE2E6FF',
  'font-color': '#000000FF',
  'secondary-font-color': '#6C757DFF',
  'hover_font-color': '#0078D4FF',
  'focus_font-color': '#0056B3FF',
  'watermark-font-color': '#B3B5B6FF',
  'font-family': 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  'border_color': '#DEE2E6FF',
  'secondary-border_color': '#E9ECEEFF',
  'hover_border_color': '#0078D4FF',
  'focus_border_color': '#0056B3FF',
  'shadow_color': '#00000019',
  'hover_shadow_color': '#00000026',
  'focus_shadow_color': '#0078D440'
};

// 数据库字段名到CSS变量名的映射
const DB_FIELD_TO_CSS_VAR = {
  background_color: 'background-color',
  secondary_background_color: 'secondary-background-color',
  hover_background_color: 'hover_background-color',
  focus_background_color: 'focus_background-color',
  font_color: 'font-color',
  secondary_font_color: 'secondary-font-color',
  hover_font_color: 'hover_font-color',
  focus_font_color: 'focus_font-color',
  watermark_font_color: 'watermark-font-color',
  font_family: 'font-family',
  border_color: 'border_color',
  secondary_border_color: 'secondary-border_color',
  hover_border_color: 'hover_border_color',
  focus_border_color: 'focus_border_color',
  shadow_color: 'shadow_color',
  hover_shadow_color: 'hover_shadow_color',
  focus_shadow_color: 'focus_shadow_color'
};

// 主题服务API调用层
const themeService = {
  async getUserAllThemes(email, username) {
    return apiClient.get('/UserThemeSettings', { params: { email, username } });
  },
  async setActiveTheme(id, email, username) {
    return apiClient.put(`/UserThemeSettings/setActive/${id}`, { email, username });
  },
  // 新增：设置个人默认主题的API调用
  async setDefaultTheme(id, email, username) {
    return apiClient.put(`/UserThemeSettings/setDefault/${id}`, { email, username });
  },
  async createUserTheme(themeData) {
    return apiClient.post('/UserThemeSettings', themeData);
  },
  async updateUserTheme(id, themeData) {
    return apiClient.put(`/UserThemeSettings/${id}`, themeData);
  },
  async deleteUserTheme(id) {
    return apiClient.delete(`/UserThemeSettings/${id}`);
  }
};

export const ThemeProvider = ({ children }) => {
  const [allThemes, setAllThemes] = useState([]);
  const [activeTheme, setActiveTheme] = useState(null);
  const [previewTheme, setPreviewTheme] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { user, isAuthenticated } = useAuth();

  // 工具函数：DB转CSS
  const transformDbThemeToCss = useCallback((dbTheme) => {
    if (!dbTheme) return null;
    const cssTheme = {};
    for (const dbField in DB_FIELD_TO_CSS_VAR) {
      if (dbTheme[dbField] !== undefined && dbTheme[dbField] !== null) {
        cssTheme[DB_FIELD_TO_CSS_VAR[dbField]] = dbTheme[dbField];
      }
    }
    return cssTheme;
  }, []);

  // 工具函数：CSS转DB
  const transformCssToDbTheme = useCallback((cssTheme) => {
    const dbTheme = {};
    for (const dbField in DB_FIELD_TO_CSS_VAR) {
      const cssVar = DB_FIELD_TO_CSS_VAR[dbField];
      if (cssTheme[cssVar] !== undefined) {
        dbTheme[dbField] = cssTheme[cssVar];
      }
    }
    return dbTheme;
  }, []);

  // 核心工具函数：将主题应用到DOM
  const applyThemeToRoot = useCallback((theme) => {
    const root = document.documentElement;
    root.removeAttribute('data-custom-theme');
    root.removeAttribute('data-preview-theme');

    if (theme === 'default' || !theme) {
      root.setAttribute('data-theme', 'default');
      Object.keys(DEFAULT_THEME).forEach(key => {
        root.style.setProperty(`--${key}`, DEFAULT_THEME[key]);
      });
    } else if (typeof theme === 'object') {
      const cssTheme = transformDbThemeToCss(theme);
      if (cssTheme) {
        root.setAttribute('data-custom-theme', theme.theme_name || 'custom');
        Object.keys(cssTheme).forEach(key => {
          root.style.setProperty(`--${key}`, cssTheme[key]);
        });
      }
    }
  }, [transformDbThemeToCss]);

  // 核心数据获取函数：包含三级回退逻辑
  const fetchUserThemes = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setAllThemes([]);
      setActiveTheme(null);
      applyThemeToRoot('default');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await themeService.getUserAllThemes(user.email, user.username);
      
      if (response && response.success && Array.isArray(response.themes)) {
        const fetchedThemes = response.themes;
        setAllThemes(fetchedThemes);

        // 1. 严格查找当前用户的活动主题
        const activeForUser = fetchedThemes.find(t => t.is_active && t.email === user.email && t.username === user.username);
        if (activeForUser) {
          setActiveTheme(activeForUser);
          applyThemeToRoot(activeForUser);
          return;
        }

        // 2. 若无活动主题，则严格查找当前用户的个人默认主题
        const defaultForUser = fetchedThemes.find(t => t.is_default && t.email === user.email && t.username === user.username);
        if (defaultForUser) {
          setActiveTheme(defaultForUser);
          applyThemeToRoot(defaultForUser);
          return;
        }
        
        // 3. 最终回退到系统全局默认
        setActiveTheme(null);
        applyThemeToRoot('default');
      } else {
        throw new Error('API data format error');
      }
    } catch (error) {
      console.error('获取用户主题失败:', error);
      setAllThemes([]);
      setActiveTheme(null);
      applyThemeToRoot('default');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, applyThemeToRoot]);

  // ---- 写操作函数 (采用本地状态更新，避免重复获取) ----

  const setActiveThemeById = useCallback(async (themeId) => {
    if (!isAuthenticated || !user) throw new Error('用户未登录');
    try {
      await themeService.setActiveTheme(themeId, user.email, user.username);
      const updatedThemes = allThemes.map(t => ({ ...t, is_active: t.id === themeId }));
      const newActiveTheme = updatedThemes.find(t => t.id === themeId);
      
      setAllThemes(updatedThemes);
      if (newActiveTheme) {
        setActiveTheme(newActiveTheme);
        applyThemeToRoot(newActiveTheme);
      }
      return { success: true };
    } catch (error) {
      console.error('设置活动主题失败:', error);
      throw error;
    }
  }, [isAuthenticated, user, allThemes, applyThemeToRoot]);

  const setDefaultThemeById = useCallback(async (themeId) => {
    if (!isAuthenticated || !user) throw new Error('用户未登录');
    try {
      await themeService.setDefaultTheme(themeId, user.email, user.username);
      const updatedThemes = allThemes.map(t => ({ ...t, is_default: t.id === themeId }));
      setAllThemes(updatedThemes);
      // 如果当前没有活动主题，设置默认后可能需要更新UI
      if (!activeTheme) {
        const newActive = updatedThemes.find(t => t.is_default);
        if (newActive) {
            setActiveTheme(newActive);
            applyThemeToRoot(newActive);
        }
      }
      return { success: true };
    } catch (error) {
      console.error('设置默认主题失败:', error);
      throw error;
    }
  }, [isAuthenticated, user, allThemes, activeTheme, applyThemeToRoot]);

  const createNewTheme = useCallback(async (themeName, themeSettings, setAsActive = false) => {
    if (!isAuthenticated || !user) throw new Error('用户未登录');
    try {
      const themeData = {
        email: user.email,
        username: user.username,
        theme_name: themeName,
        is_active: setAsActive,
        ...transformCssToDbTheme(themeSettings)
      };
      const response = await themeService.createUserTheme(themeData);
      if (response && response.success && response.theme) {
        const newTheme = response.theme; // 使用后端返回的完整对象
        let newThemesList = [...allThemes, newTheme];

        if (setAsActive) {
            newThemesList = newThemesList.map(t => ({...t, is_active: t.id === newTheme.id}));
            setActiveTheme(newTheme);
            applyThemeToRoot(newTheme);
        }
        setAllThemes(newThemesList);
        return { success: true, theme: newTheme };
      } else {
        throw new Error(response?.message || '创建主题失败');
      }
    } catch (error) {
      console.error('创建主题失败:', error);
      throw error;
    }
  }, [isAuthenticated, user, allThemes, transformCssToDbTheme, applyThemeToRoot]);

    // 更新主题 - (升级版：返回更新后的主题)
  const updateThemeById = useCallback(async (themeId, updateData) => {
    try {
      const response = await themeService.updateUserTheme(themeId, updateData);
      if (response && response.success && response.theme) {
        const updatedTheme = response.theme;
        const newThemesList = allThemes.map(t => t.id === themeId ? updatedTheme : t);
        setAllThemes(newThemesList);
        
        if (activeTheme && activeTheme.id === themeId) {
          setActiveTheme(updatedTheme);
          applyThemeToRoot(updatedTheme);
        }
        
        // --- 核心修改 ---
        // 返回从后端获取的、最权威的、完整的更新后对象
        return { success: true, theme: updatedTheme }; 
      } else {
        throw new Error(response?.message || '更新主题失败');
      }
    } catch (error) {
      console.error('更新主题失败:', error);
      throw error;
    }
  }, [allThemes, activeTheme, applyThemeToRoot]);

  const deleteThemeById = useCallback(async (themeId) => {
    try {
      await themeService.deleteUserTheme(themeId);
      const newThemesList = allThemes.filter(t => t.id !== themeId);
      setAllThemes(newThemesList);

      if (activeTheme && activeTheme.id === themeId) {
        // 如果删除的是活动主题，需要重新应用回退逻辑
        const defaultForUser = newThemesList.find(t => t.is_default && t.email === user.email && t.username === user.username);
        if (defaultForUser) {
          setActiveTheme(defaultForUser);
          applyThemeToRoot(defaultForUser);
        } else {
          setActiveTheme(null);
          applyThemeToRoot('default');
        }
      }
      return { success: true };
    } catch (error) {
      console.error('删除主题失败:', error);
      throw error;
    }
  }, [isAuthenticated, user, allThemes, activeTheme, applyThemeToRoot]);

  // ---- 预览功能 ----
  
  const previewThemeSettings = useCallback((themeSettings) => {
    setPreviewTheme(themeSettings);
    const root = document.documentElement;
    root.setAttribute('data-preview-theme', 'true');
    Object.keys(themeSettings).forEach(key => {
      root.style.setProperty(`--${key}`, themeSettings[key]);
    });
  }, []);

  const cancelPreview = useCallback(() => {
    setPreviewTheme(null);
    applyThemeToRoot(activeTheme || 'default');
  }, [activeTheme, applyThemeToRoot]);

  // 获取当前主题的最终设置（预览 > 活动/默认 > 系统默认）
  const getCurrentThemeSettings = useCallback(() => {
    if (previewTheme) return previewTheme;
    if (activeTheme) return transformDbThemeToCss(activeTheme);
    return DEFAULT_THEME;
  }, [previewTheme, activeTheme, transformDbThemeToCss]);

  // 修复：单一、正确的useEffect，用于初始化和响应用户变化
  useEffect(() => {
    fetchUserThemes();
  }, [isAuthenticated, user]); // 依赖用户登录状态，而不是fetchUserThemes本身

  // ---- Context Value ----
  const value = {
    // 状态
    allThemes,
    activeTheme,
    previewTheme,
    loading,
    
    // 主题设置
    themeSettings: getCurrentThemeSettings(),
    defaultTheme: DEFAULT_THEME,
    
    // 操作函数
    fetchUserThemes,
    setActiveThemeById,
    setDefaultThemeById, // 暴露设置默认主题的函数
    createNewTheme,
    updateThemeById,
    deleteThemeById,
    previewThemeSettings,
    cancelPreview,
    
    // 工具函数
    transformDbThemeToCss,
    transformCssToDbTheme
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
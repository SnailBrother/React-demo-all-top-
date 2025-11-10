import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { apiClient } from '../utils';

const ThemeContext = createContext();

// 默认主题配置
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

// 主题服务函数
const themeService = {
  async getUserAllThemes(email, username) {
    try {
      const response = await apiClient.get('/UserThemeSettings', {
        params: { email, username }
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  async setActiveTheme(id, email, username) {
    try {
      const response = await apiClient.put(`/UserThemeSettings/setActive/${id}`, {
        email,
        username
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  async createUserTheme(themeData) {
    try {
      const response = await apiClient.post('/UserThemeSettings', themeData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  async updateUserTheme(id, themeData) {
    try {
      const response = await apiClient.put(`/UserThemeSettings/${id}`, themeData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  async deleteUserTheme(id) {
    try {
      const response = await apiClient.delete(`/UserThemeSettings/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  }
};

export const ThemeProvider = ({ children }) => {
  const [allThemes, setAllThemes] = useState([]);
  const [activeTheme, setActiveTheme] = useState(null);
  const [previewTheme, setPreviewTheme] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { user, isAuthenticated } = useAuth();

  // 从数据库主题数据转换为CSS变量格式
  const transformDbThemeToCss = useCallback((dbTheme) => {
    if (!dbTheme) return null;
    
    const cssTheme = {};
    Object.keys(DB_FIELD_TO_CSS_VAR).forEach(dbField => {
      const cssVar = DB_FIELD_TO_CSS_VAR[dbField];
      if (dbTheme[dbField] !== undefined && dbTheme[dbField] !== null) {
        cssTheme[cssVar] = dbTheme[dbField];
      }
    });
    
    return cssTheme;
  }, []);

  // 从CSS变量格式转换为数据库字段格式
  const transformCssToDbTheme = useCallback((cssTheme) => {
    const dbTheme = {};
    
    Object.keys(DB_FIELD_TO_CSS_VAR).forEach(dbField => {
      const cssVar = DB_FIELD_TO_CSS_VAR[dbField];
      if (cssTheme[cssVar] !== undefined) {
        dbTheme[dbField] = cssTheme[cssVar];
      }
    });
    
    return dbTheme;
  }, []);

  // 获取当前应该使用的主题
  const getCurrentThemeSettings = useCallback(() => {
    if (previewTheme) {
      return previewTheme;
    }
    if (activeTheme) {
      return transformDbThemeToCss(activeTheme);
    }
    return DEFAULT_THEME;
  }, [previewTheme, activeTheme, transformDbThemeToCss]);

  // 应用主题到 :root
  const applyThemeToRoot = useCallback((theme) => {
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
    } else if (typeof theme === 'object') {
      // 应用数据库主题
      const cssTheme = transformDbThemeToCss(theme);
      if (cssTheme) {
        root.setAttribute('data-custom-theme', theme.theme_name || 'custom');
        Object.keys(cssTheme).forEach(key => {
          const cssVarName = `--${key}`;
          root.style.setProperty(cssVarName, cssTheme[key]);
        });
      }
    }
  }, [transformDbThemeToCss]);

  // 核心：获取用户所有主题并设置活动主题
  const fetchUserThemes = useCallback(async () => {
    if (!isAuthenticated || !user) {
      console.log('用户未登录，使用默认主题');
      setAllThemes([]);
      setActiveTheme(null);
      applyThemeToRoot('default');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await themeService.getUserAllThemes(user.email, user.username);
      
      if (response && response.success && Array.isArray(response.themes)) {
        const fetchedThemes = response.themes;
        setAllThemes(fetchedThemes);

        // 查找当前用户的活动主题
        const activeThemeForUser = fetchedThemes.find(theme => 
          theme.is_active && 
          theme.email === user.email && 
          theme.username === user.username
        );

        if (activeThemeForUser) {
          setActiveTheme(activeThemeForUser);
          applyThemeToRoot(activeThemeForUser);
          console.log('应用活动主题:', activeThemeForUser.theme_name);
        } else {
          // 没有活动主题，使用默认主题
          setActiveTheme(null);
          applyThemeToRoot('default');
          console.log('未找到活动主题，使用默认主题');
        }
      } else {
        // API返回异常
        setAllThemes([]);
        setActiveTheme(null);
        applyThemeToRoot('default');
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

  // 设置活动主题
  const setActiveThemeById = useCallback(async (themeId) => {
    if (!isAuthenticated || !user) {
      throw new Error('用户未登录');
    }

    try {
      const response = await themeService.setActiveTheme(themeId, user.email, user.username);
      
      if (response && response.success) {
        // 重新获取主题列表以更新状态
        await fetchUserThemes();
        return { success: true };
      } else {
        throw new Error(response?.message || '设置活动主题失败');
      }
    } catch (error) {
      console.error('设置活动主题失败:', error);
      throw error;
    }
  }, [isAuthenticated, user, fetchUserThemes]);

  // 创建新主题
  const createNewTheme = useCallback(async (themeName, themeSettings, setAsActive = false) => {
    if (!isAuthenticated || !user) {
      throw new Error('用户未登录');
    }

    try {
      const dbTheme = transformCssToDbTheme(themeSettings);
      const themeData = {
        email: user.email,
        username: user.username,
        theme_name: themeName,
        is_active: setAsActive,
        ...dbTheme
      };

      const response = await themeService.createUserTheme(themeData);
      
      if (response && response.success) {
        // 刷新主题列表
        await fetchUserThemes();
        return { success: true, theme: response.theme };
      } else {
        throw new Error(response?.message || '创建主题失败');
      }
    } catch (error) {
      console.error('创建主题失败:', error);
      throw error;
    }
  }, [isAuthenticated, user, transformCssToDbTheme, fetchUserThemes]);

  // 更新主题
  const updateThemeById = useCallback(async (themeId, updateData) => {
    try {
      const response = await themeService.updateUserTheme(themeId, updateData);
      
      if (response && response.success) {
        // 刷新主题列表
        await fetchUserThemes();
        return { success: true };
      } else {
        throw new Error(response?.message || '更新主题失败');
      }
    } catch (error) {
      console.error('更新主题失败:', error);
      throw error;
    }
  }, [fetchUserThemes]);

  // 删除主题
  const deleteThemeById = useCallback(async (themeId) => {
    try {
      const response = await themeService.deleteUserTheme(themeId);
      
      if (response && response.success) {
        // 刷新主题列表
        await fetchUserThemes();
        return { success: true };
      } else {
        throw new Error(response?.message || '删除主题失败');
      }
    } catch (error) {
      console.error('删除主题失败:', error);
      throw error;
    }
  }, [fetchUserThemes]);

  // 实时预览主题
  const previewThemeSettings = useCallback((themeSettings) => {
    setPreviewTheme(themeSettings);
    const root = document.documentElement;
    root.setAttribute('data-preview-theme', 'true');
    Object.keys(themeSettings).forEach(key => {
      const cssVarName = `--${key}`;
      root.style.setProperty(cssVarName, themeSettings[key]);
    });
  }, []);

  // 取消预览，恢复当前主题
  const cancelPreview = useCallback(() => {
    setPreviewTheme(null);
    if (activeTheme) {
      applyThemeToRoot(activeTheme);
    } else {
      applyThemeToRoot('default');
    }
  }, [activeTheme, applyThemeToRoot]);

  // 初始化：获取用户主题
  useEffect(() => {
    fetchUserThemes();
  }, [fetchUserThemes]);

  // 当用户登录状态变化时，重新获取主题
  useEffect(() => {
    fetchUserThemes();
  }, [isAuthenticated, user, fetchUserThemes]);

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
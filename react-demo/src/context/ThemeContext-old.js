// src/context/ThemeContext.js
// src/context/ThemeContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { apiClient } from '../utils';

const ThemeContext = createContext();

// 默认主题配置 - 统一在这里管理
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

  // 获取用户的活动主题 - 添加这个缺失的方法
  async getActiveUserTheme(email, username) {
    try {
      const response = await apiClient.get('/UserThemeSettings/active', {
        params: { email, username }
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
  // 获取用户的所有主题
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

  // 设置活动主题
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

  // 创建新主题
  async createUserTheme(themeData) {
    try {
      const response = await apiClient.post('/UserThemeSettings', themeData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 更新主题内容
  async updateUserTheme(id, themeData) {
    try {
      const response = await apiClient.put(`/UserThemeSettings/${id}`, themeData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 删除主题
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

  // 获取用户所有主题
  const fetchUserAllThemes = useCallback(async () => {
    if (!isAuthenticated || !user) {
      console.log('用户未登录，无法获取主题');
      setAllThemes([]);
      return;
    }

    try {
      console.log('开始获取用户所有主题...', { email: user.email, username: user.username });
      const response = await themeService.getUserAllThemes(user.email, user.username);
      console.log('用户所有主题响应:', response);
      
      if (response && response.success && Array.isArray(response.themes)) {
        setAllThemes(response.themes);
        
        // 查找活动主题
        const active = response.themes.find(theme => theme.is_active);
        if (active) {
          setActiveTheme(active);
          applyThemeToRoot(active);
          console.log('找到活动主题:', active.theme_name);
        } else {
          setActiveTheme(null);
          applyThemeToRoot('default');
          console.log('未找到活动主题，使用默认主题');
        }
      } else {
        console.warn('API 返回数据格式异常:', response);
        setAllThemes([]);
        setActiveTheme(null);
      }
    } catch (error) {
      console.error('获取用户主题失败:', error);
      setAllThemes([]);
      setActiveTheme(null);
    }
  }, [isAuthenticated, user]);

  // 获取用户活动主题
  const fetchActiveTheme = useCallback(async () => {
    if (!isAuthenticated || !user) {
      console.log('用户未登录，使用后备主题');
      setActiveTheme(null);
      setLoading(false);
      return;
    }

    try {
      console.log('开始获取用户活动主题...', { email: user.email, username: user.username });
      const response = await themeService.getActiveUserTheme(user.email, user.username);
      console.log('用户活动主题响应:', response);
      
      if (response && response.success && response.theme) {
        setActiveTheme(response.theme);
        applyThemeToRoot(response.theme);
      } else {
        setActiveTheme(null);
        applyThemeToRoot('default');
      }
    } catch (error) {
      console.error('获取用户活动主题失败:', error);
      setActiveTheme(null);
      applyThemeToRoot('default');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // 设置活动主题
  const setActiveThemeById = useCallback(async (themeId) => {
    if (!isAuthenticated || !user) {
      throw new Error('用户未登录');
    }

    try {
      const response = await themeService.setActiveTheme(themeId, user.email, user.username);
      
      if (response && response.success) {
        // 更新本地状态
        const updatedThemes = allThemes.map(theme => ({
          ...theme,
          is_active: theme.id === themeId
        }));
        
        const newActiveTheme = updatedThemes.find(theme => theme.id === themeId);
        
        setAllThemes(updatedThemes);
        setActiveTheme(newActiveTheme);
        applyThemeToRoot(newActiveTheme);
        
        return { success: true };
      } else {
        throw new Error(response?.message || '设置活动主题失败');
      }
    } catch (error) {
      console.error('设置活动主题失败:', error);
      throw error;
    }
  }, [isAuthenticated, user, allThemes]);

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
        await fetchUserAllThemes();
        return { success: true, theme: response.theme };
      } else {
        throw new Error(response?.message || '创建主题失败');
      }
    } catch (error) {
      console.error('创建主题失败:', error);
      throw error;
    }
  }, [isAuthenticated, user, transformCssToDbTheme, fetchUserAllThemes]);

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
      console.log('应用默认主题');
    } else if (typeof theme === 'object') {
      // 应用数据库主题
      const cssTheme = transformDbThemeToCss(theme);
      if (cssTheme) {
        root.setAttribute('data-custom-theme', theme.theme_name || 'custom');
        Object.keys(cssTheme).forEach(key => {
          const cssVarName = `--${key}`;
          root.style.setProperty(cssVarName, cssTheme[key]);
        });
        console.log('应用数据库主题:', theme.theme_name);
      }
    }
  }, [transformDbThemeToCss]);
  // 更新主题
// src/context/ThemeContext.js
// 更新主题
const updateThemeById = useCallback(async (themeId, updateData) => {
  try {
    // 直接使用传递的 updateData，它已经包含了 theme_name 和其他字段
    const response = await themeService.updateUserTheme(themeId, updateData);
    
    if (response && response.success) {
      // 刷新主题列表
      await fetchUserAllThemes();
      
      // 如果更新的是当前活动主题，更新 activeTheme
      if (activeTheme && activeTheme.id === themeId) {
        const updatedTheme = response.theme || { ...activeTheme, ...updateData };
        setActiveTheme(updatedTheme);
        applyThemeToRoot(updatedTheme);
      }
      
      return { success: true };
    } else {
      throw new Error(response?.message || '更新主题失败');
    }
  } catch (error) {
    console.error('更新主题失败:', error);
    throw error;
  }
}, [fetchUserAllThemes, activeTheme, applyThemeToRoot]);

  // 删除主题
  const deleteThemeById = useCallback(async (themeId) => {
    try {
      const response = await themeService.deleteUserTheme(themeId);
      
      if (response && response.success) {
        // 如果删除的是活动主题，需要重新获取活动主题
        if (activeTheme && activeTheme.id === themeId) {
          await fetchActiveTheme();
        }
        // 刷新主题列表
        await fetchUserAllThemes();
        return { success: true };
      } else {
        throw new Error(response?.message || '删除主题失败');
      }
    } catch (error) {
      console.error('删除主题失败:', error);
      throw error;
    }
  }, [activeTheme, fetchActiveTheme, fetchUserAllThemes]);

  

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

  // 初始化：获取用户活动主题和所有主题
  useEffect(() => {
    const initializeTheme = async () => {
      setLoading(true);
      if (isAuthenticated && user) {
        await Promise.all([fetchActiveTheme(), fetchUserAllThemes()]);
      } else {
        applyThemeToRoot('default');
        setLoading(false);
      }
    };

    initializeTheme();
  }, [isAuthenticated, user, fetchActiveTheme, fetchUserAllThemes, applyThemeToRoot]);

  // 当用户登录状态变化时，重新获取主题
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchActiveTheme();
      fetchUserAllThemes();
    } else {
      // 用户退出登录时，重置为主题
      setActiveTheme(null);
      setAllThemes([]);
      applyThemeToRoot('default');
    }
  }, [isAuthenticated, user, fetchActiveTheme, fetchUserAllThemes, applyThemeToRoot]);

  const value = {
    // 状态
    allThemes,
    activeTheme,
    previewTheme,
    loading,
    
    // 主题设置
    themeSettings: getCurrentThemeSettings(),
    defaultTheme: DEFAULT_THEME, // 暴露默认主题
    
    // 操作函数
    fetchUserAllThemes,
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
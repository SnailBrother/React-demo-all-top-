// src/context/ThemeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { apiClient } from '../utils';

const ThemeContext = createContext();

// 默认主题配置 - 作为后备值（只在获取不到用户主题时使用）
const FALLBACK_THEME = {
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
  // 获取用户主题设置
  async getUserTheme(email, username, themeName = '默认主题') {
    try {
      const response = await apiClient.get('/UserThemeSettings', {
        params: { email, username, theme_name: themeName }
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 保存用户主题设置
  async saveUserTheme(themeData) {
    try {
      const response = await apiClient.post('/UserThemeSettings', themeData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 更新用户主题设置
  async updateUserTheme(id, themeData) {
    try {
      const response = await apiClient.put(`/api/UserThemeSettings/${id}`, themeData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 获取用户的所有主题
  async getUserAllThemes(email, username) {
    try {
      const response = await apiClient.get('/UserThemeSettings/all', {
        params: { email, username }
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 删除主题设置
  async deleteUserTheme(id) {
    try {
      const response = await apiClient.delete(`/api/UserThemeSettings/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  }
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('default');
  const [customThemes, setCustomThemes] = useState({});
  const [previewTheme, setPreviewTheme] = useState(null);
  const [userDefaultTheme, setUserDefaultTheme] = useState(null); // 改为 null，表示未获取
  const [loading, setLoading] = useState(true);
  
  const { user, isAuthenticated } = useAuth();

  // 从数据库主题数据转换为CSS变量格式
  const transformDbThemeToCss = (dbTheme) => {
    const cssTheme = {};
    
    Object.keys(DB_FIELD_TO_CSS_VAR).forEach(dbField => {
      const cssVar = DB_FIELD_TO_CSS_VAR[dbField];
      if (dbTheme[dbField] !== undefined && dbTheme[dbField] !== null) {
        cssTheme[cssVar] = dbTheme[dbField];
      }
    });
    
    return cssTheme;
  };

  // 从CSS变量格式转换为数据库字段格式
  const transformCssToDbTheme = (cssTheme) => {
    const dbTheme = {};
    
    Object.keys(DB_FIELD_TO_CSS_VAR).forEach(dbField => {
      const cssVar = DB_FIELD_TO_CSS_VAR[dbField];
      if (cssTheme[cssVar] !== undefined) {
        dbTheme[dbField] = cssTheme[cssVar];
      }
    });
    
    return dbTheme;
  };

  // 获取当前应该使用的主题
  const getCurrentThemeSettings = () => {
    // 如果用户有自定义主题，优先使用用户主题
    if (userDefaultTheme) {
      return userDefaultTheme;
    }
    // 如果没有获取到用户主题，使用后备主题
    return FALLBACK_THEME;
  };

  // 获取用户默认主题
  const fetchUserDefaultTheme = async () => {
    if (!isAuthenticated || !user) {
      console.log('用户未登录，使用后备主题');
      setUserDefaultTheme(null); // 设置为 null，表示使用后备主题
      setLoading(false);
      return;
    }

    try {
      console.log('开始获取用户主题...', { email: user.email, username: user.username });
      const response = await themeService.getUserTheme(user.email, user.username);
      console.log('用户主题响应:', response);
      
      if (response && response.success && response.theme) {
        const cssTheme = transformDbThemeToCss(response.theme);
        console.log('转换后的CSS主题:', cssTheme);
        setUserDefaultTheme(cssTheme);
        
        // 如果当前是默认主题，立即应用
        if (currentTheme === 'default') {
          applyThemeToRoot(cssTheme);
        }
      } else {
        // 如果没有找到主题，设置为 null 表示使用后备主题
        console.log('未找到用户主题设置，将使用后备主题');
        setUserDefaultTheme(null);
      }
    } catch (error) {
      console.error('获取用户主题失败:', error);
      // 获取失败时使用后备主题
      setUserDefaultTheme(null);
    } finally {
      setLoading(false);
    }
  };

  // 保存用户默认主题到数据库
  const saveUserDefaultThemeToDb = async (themeSettings) => {
    if (!isAuthenticated || !user) {
      return { success: false, message: '用户未登录' };
    }

    try {
      const dbTheme = transformCssToDbTheme(themeSettings);
      const response = await themeService.saveUserTheme({
        email: user.email,
        username: user.username,
        theme_name: '默认主题',
        ...dbTheme
      });

      return response;
    } catch (error) {
      console.error('保存用户主题失败:', error);
      return { success: false, message: error.message };
    }
  };

  // 应用主题到 :root
  const applyThemeToRoot = (theme) => {
    const root = document.documentElement;
    
    // 移除之前的自定义主题属性
    root.removeAttribute('data-custom-theme');
    root.removeAttribute('data-preview-theme');
    
    if (theme === 'default') {
      // 应用默认主题（用户主题或后备主题）
      root.setAttribute('data-theme', 'default');
      const themeToApply = getCurrentThemeSettings();
      Object.keys(themeToApply).forEach(key => {
        const cssVarName = `--${key}`;
        root.style.setProperty(cssVarName, themeToApply[key]);
      });
      console.log('应用默认主题:', themeToApply);
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

  // 初始化：获取用户默认主题
  useEffect(() => {
    const initializeTheme = async () => {
      setLoading(true);
      await fetchUserDefaultTheme();
      
      // 应用默认主题
      applyThemeToRoot('default');
      
      // 加载保存的自定义主题
      const savedThemes = localStorage.getItem('customThemes');
      if (savedThemes) {
        setCustomThemes(JSON.parse(savedThemes));
      }
    };

    initializeTheme();
  }, [isAuthenticated, user]);

  // 当用户登录状态变化时，重新获取主题
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserDefaultTheme();
    } else {
      // 用户退出登录时，重置为主题
      setUserDefaultTheme(null);
      applyThemeToRoot('default');
    }
  }, [isAuthenticated, user]);

  // 保存自定义主题
  const saveCustomTheme = async (username, settings) => {
    const newTheme = {
      ...settings,
      username,
      createdAt: new Date().toISOString()
    };
    
    const updatedThemes = {
      ...customThemes,
      [username]: newTheme
    };
    
    setCustomThemes(updatedThemes);
    localStorage.setItem('customThemes', JSON.stringify(updatedThemes));
    
    // 保存后应用该主题
    applyCustomTheme(username);
  };

  // 应用自定义主题
  const applyCustomTheme = (username) => {
    setCurrentTheme(username);
    setPreviewTheme(null);
    if (username === 'default') {
      applyThemeToRoot('default');
    } else if (customThemes[username]) {
      applyThemeToRoot(customThemes[username]);
    }
  };

  // 更新自定义主题
  const updateCustomTheme = (username, settings) => {
    if (customThemes[username]) {
      const updatedThemes = {
        ...customThemes,
        [username]: {
          ...settings,
          username,
          updatedAt: new Date().toISOString()
        }
      };
      
      setCustomThemes(updatedThemes);
      localStorage.setItem('customThemes', JSON.stringify(updatedThemes));
      
      // 如果当前正在使用这个主题，重新应用
      if (currentTheme === username) {
        applyThemeToRoot(updatedThemes[username]);
      }
    }
  };

  // 删除自定义主题
  const deleteCustomTheme = (username) => {
    const updatedThemes = { ...customThemes };
    delete updatedThemes[username];
    
    setCustomThemes(updatedThemes);
    localStorage.setItem('customThemes', JSON.stringify(updatedThemes));
    
    // 如果删除的是当前主题，回退到默认主题
    if (currentTheme === username) {
      applyCustomTheme('default');
    }
  };

  // 重置为默认主题
  const resetToDefault = () => {
    applyCustomTheme('default');
  };

  // 更新默认主题（保存到数据库）
  const updateDefaultTheme = async (settings) => {
    const result = await saveUserDefaultThemeToDb(settings);
    if (result.success) {
      setUserDefaultTheme(settings);
      if (currentTheme === 'default') {
        applyThemeToRoot(settings);
      }
    }
    return result;
  };

  const value = {
    currentTheme,
    customThemes,
    previewTheme,
    userDefaultTheme, // 暴露用户主题
    fallbackTheme: FALLBACK_THEME, // 暴露后备主题
    loading,
    themeSettings: getCurrentThemeSettings(), // 使用当前应该使用的主题
    saveCustomTheme,
    applyCustomTheme,
    updateCustomTheme,
    deleteCustomTheme,
    previewThemeSettings,
    cancelPreview,
    resetToDefault,
    updateDefaultTheme,
    refreshDefaultTheme: fetchUserDefaultTheme,
    hasUserTheme: !!userDefaultTheme // 新增：是否有用户主题
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
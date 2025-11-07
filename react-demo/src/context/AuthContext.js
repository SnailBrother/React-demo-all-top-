// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiClient } from '../utils';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userTheme, setUserTheme] = useState(null); // 新增：存储用户主题

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const savedTheme = localStorage.getItem('userTheme'); // 获取保存的主题

    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
        if (savedTheme) {
          setUserTheme(JSON.parse(savedTheme)); // 恢复主题
        }
      } catch (error) {
        console.error('解析用户数据出错:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userTheme');
      }
    }

    setLoading(false);
  }, []);

  // 新增：获取用户主题的函数
  const fetchUserTheme = async (email, username) => {
    try {
      const response = await apiClient.get('/api/UserThemeSettings', {
        params: { email, username, theme_name: '默认主题' }
      });

      console.log('主题响应数据:', response);

      if (response && response.theme) {
        const themeData = response.theme;
        setUserTheme(themeData);
        localStorage.setItem('userTheme', JSON.stringify(themeData));
        return themeData;
      } else {
        console.log('未找到用户主题设置，使用默认主题');
        return null;
      }
    } catch (error) {
      console.error('获取用户主题失败:', error);
      return null;
    }
  };

  // 新增：应用主题到根元素
  const applyThemeToRoot = (theme) => {
    if (!theme) return;
    
    const root = document.documentElement;
    
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

    // 应用主题变量
    Object.keys(DB_FIELD_TO_CSS_VAR).forEach(dbField => {
      const cssVar = DB_FIELD_TO_CSS_VAR[dbField];
      if (theme[dbField] !== undefined && theme[dbField] !== null) {
        const cssVarName = `--${cssVar}`;
        root.style.setProperty(cssVarName, theme[dbField]);
      }
    });

    console.log('主题应用成功');
  };

  // 修改登录函数，在登录成功后获取并应用主题
  const login = async (email, password) => {
    setLoading(true);
    try {
      // 登录API调用
      const responseData = await apiClient.post('/auth/login', {
        email,
        password
      });

      console.log('登录响应数据:', responseData);

      if (!responseData) {
        throw new Error('登录响应数据为空');
      }

      // 创建用户数据
      const userData = {
        id: responseData.id || responseData.user?.id || Date.now(),
        username: responseData.username || responseData.user?.username || email.split('@')[0],
        email: responseData.email || responseData.user?.email || email,
        loginTime: new Date().toISOString()
      };

      setUser(userData);
      
      // 获取token
      const token = responseData.token || 
                   responseData.accessToken || 
                   responseData.access_token ||
                   responseData.authToken ||
                   responseData.user?.token;
                 
      if (token) {
        localStorage.setItem('token', token);
        console.log('保存的token:', token);
      } else {
        console.warn('未找到token字段，使用模拟token');
        localStorage.setItem('token', 'mock-token-' + Date.now());
      }
      
      localStorage.setItem('user', JSON.stringify(userData));

      // 新增：登录成功后获取用户主题
      console.log('开始获取用户主题...');
      const theme = await fetchUserTheme(userData.email, userData.username);
      if (theme) {
        applyThemeToRoot(theme);
        console.log('用户主题加载并应用成功');
      } else {
        console.log('使用默认主题');
      }

      return { success: true };

    } catch (error) {
      console.error('登录错误:', error);
      
      let errorMessage = '登录失败';
      
      if (error.message && error.message.includes('HTTP error')) {
        errorMessage = error.message;
      } else {
        errorMessage = error.message || '登录失败';
      }
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 注册功能
  const register = async (username, email, password) => {
    setLoading(true);
    try {
      const responseData = await apiClient.post('/auth/register', {
        username,
        email,
        password
      });

      console.log('注册响应数据:', responseData);

      return { success: true };

    } catch (error) {
      console.error('注册错误:', error);
      
      let errorMessage = '注册失败';
      
      if (error.message && error.message.includes('HTTP error')) {
        errorMessage = error.message;
      } else {
        errorMessage = error.message || '注册失败';
      }
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 退出登录 - 清除主题
  const logout = () => {
    setUser(null);
    setUserTheme(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userTheme');
    
    // 重置CSS变量
    const root = document.documentElement;
    root.removeAttribute('style'); // 清除所有内联样式
  };

  // 提供上下文值
  const value = {
    user,
    userTheme, // 新增：提供用户主题
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
    refreshTheme: () => user && fetchUserTheme(user.email, user.username) // 新增：刷新主题函数
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth必须在AuthProvider内部使用');
  }
  return context;
};

export default AuthContext;
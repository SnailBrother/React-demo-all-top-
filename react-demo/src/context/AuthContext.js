// src/context/AuthContext.js
// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiClient } from '../utils';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('解析用户数据出错:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    setLoading(false);
  }, []);

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

  // 退出登录
  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // 提供上下文值
  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user
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
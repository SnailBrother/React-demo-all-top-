//src/context/AuthContext.js
//这个代码创建了一个完整的认证管理系统，管理用户登录状态并在整个应用中共享！
import React, { createContext, useState, useContext, useEffect } from 'react';
//createContext创建上下文，useState管理状态，useContext使用上下文，useEffect处理副作用
import { authService } from '../services';
//导入认证服务：authService是处理登录注册API调用的服务
const AuthContext = createContext();
//创建上下文：AuthContext就像一个全局的"共享数据箱"

//AuthProvider是一个包装组件，为所有子组件提供认证功能
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);// 存储用户信息 存储当前登录用户的信息（未登录时为null）
  const [loading, setLoading] = useState(true); // 加载状态 表示是否正在加载或处理认证

  useEffect(() => {
    // 检查用户是否已登录
    // useEffect在组件首次渲染时执行（因为依赖数组[]为空）

    //从本地存储检查是否有token和用户数据

    //如果有数据就设置用户状态，否则保持null

    //最后设置loading为false表示初始化完成
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        setUser(JSON.parse(userData));  // 将字符串转为对象
      } catch (error) {
        console.error('解析用户数据出错:', error);
        // 清除无效数据
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    setLoading(false);// 加载完成
  }, []);


  const login = async (email, password) => {
    setLoading(true);  // 开始加载
    try {
      const response = await authService.login(email, password);

      if (response.success) {
        const userData = {
          id: response.user.id,
          username: response.user.username,      // 用户姓名
         
          email: response.user.email,
          loginTime: new Date().toISOString()  // 登录时间
        };

        setUser(userData);  // 更新用户状态
        // 保存到本地存储
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(userData));

        return { success: true };
      } else {
        throw new Error(response.message || '登录失败');
      }
    } catch (error) {
      throw error;  // 抛出错误给调用者
    } finally {
      setLoading(false);  // 无论成功失败都停止加载
    }
  };

  //注册功能
  const register = async (username, email, password) => {
    setLoading(true);
    try {
      const response = await authService.register(username, email, password);

      if (response.success) {
        return { success: true };// 注册成功
      } else {
        throw new Error(response.message || '注册失败');
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  //退出登录
  const logout = () => {
    setUser(null);  // 清空用户状态
    localStorage.removeItem('token');  // 清除本地存储
    localStorage.removeItem('user');
  };

  //提供上下文值
  const value = {
    user,           // 当前用户信息
    login,          // 登录函数
    register,       // 注册函数
    logout,         // 退出函数
    loading,        // 加载状态
    isAuthenticated: !!user  // 是否已认证（双感叹号转为布尔值）
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 添加 useAuth hook -  使用认证的Hook 
// 这是一个自定义Hook，让组件可以方便地访问认证功能
// 检查是否在Provider内部使用，如果不是就报错
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth必须在AuthProvider内部使用');
  }
  return context;
};

export default AuthContext;
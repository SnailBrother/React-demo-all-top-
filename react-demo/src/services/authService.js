//  src/services/authService.js  
//认证服务 模拟用户登录、注册、退出等认证相关操作
import { apiClient } from '../utils/api';

export const authService = {
  async login(email, password) {
  console.log('Login attempt with:', { email });
  
  try {
    const response = await apiClient.post('/auth/login', {
      email,
      password
    });
    
    console.log('Login response:', response);
    
    if (!response.success) {
      throw new Error(response.message || '登录失败');
    }
    
    return response;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
},

  async register(username, email, password) {
    const response = await apiClient.post('/auth/register', {
      username,
      email,
      password
    });
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    return response;
  },

  async logout() {
    // 清除本地存储的 token 和用户信息
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { success: true };
  },

  async getProfile() {
    try {
      const response = await apiClient.get('/auth/profile');
      return response.user;
    } catch (error) {
      throw new Error('获取用户信息失败');
    }
  }
};
//  src/services/authService.js  
//认证服务 模拟用户登录、注册、退出等认证相关操作

// 纯API服务，不包含React组件
import { apiClient } from '../utils';

export const authService = {
  async login(email, password) {
    return await apiClient.post('/auth/login', { email, password });
  },

  async register(name, email, password) {
    return await apiClient.post('/auth/register', { name, email, password });
  },

  async logout() {
    return await apiClient.post('/auth/logout');
  },

  async refreshToken() {
    return await apiClient.post('/auth/refresh');
  }
};
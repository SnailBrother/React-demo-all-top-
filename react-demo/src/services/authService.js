//  src/services/authService.js  
//认证服务 模拟用户登录、注册、退出等认证相关操作

// 纯API服务，不包含React组件
import { apiClient } from '../utils';

export const authService = {
  async login(email, password) {
    return await apiClient.post('/auth/login', { email, password });
  },

// src/services/authService.js
async register(username, email, password) {
  try {
    console.log('发送注册请求:', { username, email, password });
    
    const response = await apiClient.post('/auth/register', { 
      username, 
      email, 
      password 
    });
    
    console.log('注册API完整响应:', response);
    console.log('注册API响应数据:', response.data);
    
    if (response.data && response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data?.message || '注册失败');
    }
  } catch (error) {
    console.error('注册API完整错误对象:', error);
    console.error('注册API错误详情:', {
      message: error.message,
      response: error.response,
      status: error.response?.status,
      data: error.response?.data,
      config: error.config
    });
    
    // 提供更详细的错误信息
    let userMessage = '注册失败，请稍后重试';
    
    if (error.response) {
      // 服务器返回了错误状态码
      const serverMessage = error.response.data?.message;
      if (serverMessage) {
        userMessage = serverMessage;
      } else if (error.response.status === 400) {
        userMessage = '请求参数错误';
      } else if (error.response.status === 409) {
        userMessage = '用户名或邮箱已被注册';
      } else if (error.response.status === 500) {
        userMessage = '服务器内部错误';
      }
    } else if (error.request) {
      // 请求发送了但没有收到响应
      userMessage = '无法连接到服务器，请检查网络连接';
    } else if (error.code === 'NETWORK_ERROR') {
      userMessage = '网络连接失败，请检查网络设置';
    } else if (error.code === 'ECONNABORTED') {
      userMessage = '请求超时，请稍后重试';
    }
    
    throw new Error(userMessage);
  }
},

  async logout() {
    return await apiClient.post('/auth/logout');
  },

  async refreshToken() {
    return await apiClient.post('/auth/refresh');
  }
};
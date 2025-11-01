////  src/services/userService.js
//  用户管理服务 模拟用户数据的 CRUD 操作

import { apiClient } from '../utils';

export const userService = {

   // 模拟获取用户列表
  async getUsers() {
    // In real app, this would be an API call
    return await apiClient.get('/users');
  },

   // 模拟根据 ID 获取用户
  async getUserById(id) {
    return await apiClient.get(`/users/${id}`);
  },

   // 模拟更新用户信息
  async updateUser(id, userData) {
    return await apiClient.put(`/users/${id}`, userData);
  },

  // 模拟删除用户
  async deleteUser(id) {
    return await apiClient.delete(`/users/${id}`);
  }
};
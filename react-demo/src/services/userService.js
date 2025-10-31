import { apiClient } from '../utils';

export const userService = {
  async getUsers() {
    // In real app, this would be an API call
    return await apiClient.get('/users');
  },

  async getUserById(id) {
    return await apiClient.get(`/users/${id}`);
  },

  async updateUser(id, userData) {
    return await apiClient.put(`/users/${id}`, userData);
  },

  async deleteUser(id) {
    return await apiClient.delete(`/users/${id}`);
  }
};
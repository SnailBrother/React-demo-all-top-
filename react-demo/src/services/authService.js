import { apiClient } from '../utils';

// Mock user database (in real app, this would be API calls)
const mockUsers = [
  {
    id: 1,
    username: 'demo',
    email: 'demo@example.com',
    password: '123456'
  }
];

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
  async login(email, password) {
    await delay(1000); // Simulate API call
    
    const user = mockUsers.find(u => u.email === email && u.password === password);
    
    if (user) {
      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        token: 'mock-jwt-token-' + Date.now()
      };
    } else {
      return {
        success: false,
        message: '邮箱或密码错误'
      };
    }
  },

  async register(username, email, password) {
    await delay(1000); // Simulate API call
    
    const existingUser = mockUsers.find(u => u.email === email);
    
    if (existingUser) {
      return {
        success: false,
        message: '该邮箱已被注册'
      };
    }
    
    const newUser = {
      id: mockUsers.length + 1,
      username,
      email,
      password
    };
    
    mockUsers.push(newUser);
    
    return {
      success: true,
      message: '注册成功，请登录'
    };
  },

  async logout() {
    await delay(500);
    return { success: true };
  },

  async getProfile() {
    await delay(800);
    
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('未授权');
    }
    
    // In real app, verify token and get user data from server
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }
};
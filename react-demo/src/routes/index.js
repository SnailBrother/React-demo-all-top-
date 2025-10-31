import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import HomeLayout from '../pages/home/index';
import Dashboard from '../pages/home/components/Dashboard';
import UserManagement from '../pages/home/components/UserManagement';
import Analytics from '../pages/home/components/Analytics';
import Reports from '../pages/home/components/Reports';
import Settings from '../pages/home/components/Settings';
import Messages from '../pages/home/components/Messages';

import Login from '../pages/user/login';
import ProtectedRoute from './ProtectedRoute';


const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* 公开路由 */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
        } 
      />
      
      {/* 受保护的路由 - 使用 HomeLayout 作为布局 */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomeLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
         <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="messages" element={<Messages />} />
      </Route>
      
      {/* 404 页面 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
//  src/routes/index.js
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
import ModuleSelect from '../pages/modules/Select';
import ModuleLayout from '../pages/modules/ModuleLayout';
import AccountingOverview from '../pages/modules/accounting/Overview';
import AccountingTransactions from '../pages/modules/accounting/Transactions';
import AccountingReports from '../pages/modules/accounting/Reports';
import MusicLibrary from '../pages/modules/music/Library';
import MusicPlayer from '../pages/modules/music/Player';
import MusicPlaylists from '../pages/modules/music/Playlists';
import OutfitCloset from '../pages/modules/outfit/Closet';
import OutfitCombos from '../pages/modules/outfit/Combos';
import OfficeDashboard from '../pages/modules/office/Dashboard';
import OfficeDocs from '../pages/modules/office/Docs';
import OfficeTasks from '../pages/modules/office/Tasks';
import ChatConversations from '../pages/modules/chat/Conversations';
import ChatContacts from '../pages/modules/chat/Contacts';
import SystemThemeSettings from '../pages/modules/system/SystemThemeSettings';
import SystemProfile from '../pages/modules/system/Profile';
import Login from '../pages/user/login';
import Register from '../pages/user/register';
import ProtectedRoute from './ProtectedRoute';

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* 公开路由 */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/apps" replace /> : <Login />
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? <Navigate to="/apps" replace /> : <Register />
        }
      />

      {/* 登录后选择模块的入口 */}
      <Route
        path="/apps"
        element={
          <ProtectedRoute>
            <ModuleSelect />
          </ProtectedRoute>
        }
      />

      {/* 各模块布局与子路由 */}
      <Route
        path="/app/accounting"
        element={
          <ProtectedRoute>
            <ModuleLayout moduleKey="accounting" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<AccountingOverview />} />
        <Route path="transactions" element={<AccountingTransactions />} />
        <Route path="reports" element={<AccountingReports />} />
      </Route>

      <Route
        path="/app/music"
        element={
          <ProtectedRoute>
            <ModuleLayout moduleKey="music" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="library" replace />} />
        <Route path="library" element={<MusicLibrary />} />
        <Route path="player" element={<MusicPlayer />} />
        <Route path="playlists" element={<MusicPlaylists />} />
      </Route>

      <Route
        path="/app/outfit"
        element={
          <ProtectedRoute>
            <ModuleLayout moduleKey="outfit" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="closet" replace />} />
        <Route path="closet" element={<OutfitCloset />} />
        <Route path="combos" element={<OutfitCombos />} />
      </Route>

      <Route
        path="/app/office"
        element={
          <ProtectedRoute>
            <ModuleLayout moduleKey="office" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<OfficeDashboard />} />
        <Route path="docs" element={<OfficeDocs />} />
        <Route path="tasks" element={<OfficeTasks />} />
      </Route>

      <Route
        path="/app/chat"
        element={
          <ProtectedRoute>
            <ModuleLayout moduleKey="chat" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="conversations" replace />} />
        <Route path="conversations" element={<ChatConversations />} />
        <Route path="contacts" element={<ChatContacts />} />
      </Route>

      <Route
        path="/app/system"
        element={
          <ProtectedRoute>
            <ModuleLayout moduleKey="system" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="theme" replace />} />
        <Route path="theme" element={<SystemThemeSettings />} />
        <Route path="profile" element={<SystemProfile />} />
      </Route>

      {/* 保留旧首页，仅用于兼容可选进入 */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomeLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/apps" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="messages" element={<Messages />} />
      </Route>

      {/* 404 页面 */}
      <Route path="*" element={<Navigate to="/apps" replace />} />
    </Routes>
  );
};

export default AppRoutes;
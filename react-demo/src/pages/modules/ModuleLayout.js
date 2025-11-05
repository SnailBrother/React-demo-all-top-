// src/pages/modules/ModuleLayout
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import Layout from '../../components/Layout';
import Sidebar from '../../components/Layout/Sidebar';
import BottomNav from '../../components/UI/BottomNav'; // 需要创建这个组件
import Tabs from '../../components/UI/Tabs';
import KeepAliveOutlet from '../../components/KeepAliveOutlet';

const moduleMenus = {
  accounting: [
    { key: 'overview', label: '总览', icon: '📊', path: '/app/accounting/overview' },
    { key: 'transactions', label: '账目', icon: '💵', path: '/app/accounting/transactions' },
    { key: 'reports', label: '报表', icon: '📈', path: '/app/accounting/reports' },
  ],
  music: [
    { key: 'library', label: '曲库', icon: '🎼', path: '/app/music/library' },
    { key: 'player', label: '播放器', icon: '▶️', path: '/app/music/player' },
    { key: 'playlists', label: '歌单', icon: '📜', path: '/app/music/playlists' },
  ],
  outfit: [
    { key: 'closet', label: '衣橱', icon: '🧥', path: '/app/outfit/closet' },
    { key: 'combos', label: '搭配', icon: '🧩', path: '/app/outfit/combos' },
  ],
  office: [
    { key: 'dashboard', label: '面板', icon: '📊', path: '/app/office/dashboard' },
    { key: 'docs', label: '文档', icon: '📄', path: '/app/office/docs' },
    { key: 'tasks', label: '任务', icon: '✅', path: '/app/office/tasks' },
  ],
  chat: [
    { key: 'conversations', label: '会话', icon: '💬', path: '/app/chat/conversations' },
    { key: 'contacts', label: '联系人', icon: '👥', path: '/app/chat/contacts' },
  ],
  system: [
    { key: 'theme', label: '主题设置', icon: '🎨', path: '/app/system/theme' },
    { key: 'profile', label: '个人资料', icon: '👤', path: '/app/system/profile' },
  ],
};

// 定义哪些模块使用底部导航
const bottomNavModules = ['music', 'chat']; // 音乐和聊天模块使用底部导航

const ModuleLayout = ({ moduleKey, onLogout }) => {
  const menuItems = moduleMenus[moduleKey] || [];
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [tabs, setTabs] = useState([]);

  // 判断当前模块是否使用底部导航
  const useBottomNav = useMemo(() => 
    bottomNavModules.includes(moduleKey), 
    [moduleKey]
  );

  // 根据当前路由和菜单项初始化或更新 tabs
  useEffect(() => {
    const currentPath = location.pathname;
    const currentMenuItem = menuItems.find(item => 
      item.path === currentPath || currentPath.startsWith(item.path + '/')
    );

    if (currentMenuItem) {
      setTabs(prev => {
        const exists = prev.find(tab => tab.key === currentMenuItem.key);
        if (exists) {
          return prev;
        }
        return [...prev, currentMenuItem];
      });
    }
  }, [location.pathname, menuItems]);

  const activeTab = useMemo(() => {
    const currentPath = location.pathname;
    const menuItem = menuItems.find(item => 
      item.path === currentPath || currentPath.startsWith(item.path + '/')
    );
    return menuItem ? menuItem.key : '';
  }, [location.pathname, menuItems]);

  const handleMenuClick = useCallback((menuItem) => {
    navigate(menuItem.path);
  }, [navigate]);

  const handleTabChange = useCallback((tabKey) => {
    const tab = menuItems.find(t => t.key === tabKey);
    if (tab) {
      navigate(tab.path);
    }
  }, [menuItems, navigate]);

  const handleTabClose = useCallback((tabKey) => {
    if (tabs.length <= 1) return;

    setTabs(prev => {
      const newTabs = prev.filter(t => t.key !== tabKey);
      if (tabKey === activeTab) {
        const closedIndex = prev.findIndex(t => t.key === tabKey);
        const nextTab = newTabs[Math.max(0, closedIndex - 1)];
        if (nextTab) {
          const menuItem = menuItems.find(item => item.key === nextTab.key);
          if (menuItem) {
            navigate(menuItem.path);
          }
        }
      }
      return newTabs;
    });
  }, [tabs, activeTab, menuItems, navigate]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  // 渲染导航组件
  const renderNavigation = () => {
    if (useBottomNav) {
      // 底部导航布局
      return (
        <BottomNav
          menuItems={menuItems}
          activeKey={activeTab}
          onMenuClick={handleMenuClick}
        />
      );
    } else {
      // 侧边栏布局
      return (
        <Sidebar
          menuItems={menuItems}
          activeKey={activeTab}
          onMenuClick={handleMenuClick}
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
        />
      );
    }
  };

  // 对于底部导航的模块，不显示 tabs
  const tabsComponent = useBottomNav ? null : (
    <Tabs
      tabs={tabs}
      activeKey={activeTab}
      onTabChange={handleTabChange}
      onTabClose={handleTabClose}
    />
  );

  return (
    <Layout 
      sidebar={!useBottomNav ? renderNavigation() : null}
      bottomNav={useBottomNav ? renderNavigation() : null}
      tabs={tabsComponent} 
      onLogout={onLogout}
    >
      <KeepAliveOutlet />
    </Layout>
  );
};

export default ModuleLayout;
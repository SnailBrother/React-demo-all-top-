import React, { useState, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/Layout';
import Sidebar from '../../components/Layout/Sidebar';
import Tabs from '../../components/UI/Tabs';
import { Outlet } from 'react-router-dom';
import styles from './home.module.css';

// 菜单配置 - 与路由对应
const menuItems = [
  { key: 'dashboard', label: '仪表板', icon: '📊', path: '/dashboard' },
  { key: 'users', label: '用户管理', icon: '👥', path: '/users' },
  { key: 'analytics', label: '数据分析', icon: '📈', path: '/analytics' },
  { key: 'reports', label: '报表中心', icon: '📋', path: '/reports' },
  { key: 'settings', label: '系统设置', icon: '⚙️', path: '/settings' },
  { key: 'messages', label: '消息中心', icon: '💬', path: '/messages' },
];

const HomeLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [tabs, setTabs] = useState([
    { key: 'dashboard', label: '仪表板', icon: '📊', path: '/dashboard' }
  ]);

  // 根据当前路径获取激活的标签页
  const activeTab = useMemo(() => {
    const currentPath = location.pathname;
    const menuItem = menuItems.find(item => item.path === currentPath);
    return menuItem ? menuItem.key : 'dashboard';
  }, [location.pathname]);

  // 处理菜单点击
  const handleMenuClick = useCallback((menuItem) => {
    // 导航到对应路由
    navigate(menuItem.path);
    
    // 检查是否已经存在该标签页
    const existingTab = tabs.find(tab => tab.key === menuItem.key);
    
    if (!existingTab) {
      // 添加新标签页
      setTabs(prev => [...prev, {
        key: menuItem.key,
        label: menuItem.label,
        icon: menuItem.icon,
        path: menuItem.path
      }]);
    }
  }, [tabs, navigate]);

  // 处理标签页切换
  const handleTabChange = useCallback((tabKey) => {
    const tab = tabs.find(t => t.key === tabKey);
    if (tab) {
      navigate(tab.path);
    }
  }, [tabs, navigate]);

  // 处理标签页关闭
  const handleTabClose = useCallback((tabKey) => {
    // 只有当有多个标签页时才允许关闭
    if (tabs.length <= 1) return;
    
    setTabs(prev => {
      const newTabs = prev.filter(tab => tab.key !== tabKey);
      
      // 如果关闭的是当前激活的标签页，导航到另一个标签页
      if (tabKey === activeTab) {
        const closedIndex = prev.findIndex(tab => tab.key === tabKey);
        const newActiveTab = newTabs[Math.max(0, closedIndex - 1)];
        if (newActiveTab) {
          navigate(newActiveTab.path);
        }
      }
      
      return newTabs;
    });
  }, [tabs, activeTab, navigate]);

  // 切换侧边栏
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const sidebar = (
    <Sidebar
      menuItems={menuItems}
      activeKey={activeTab}
      onMenuClick={handleMenuClick}
      collapsed={sidebarCollapsed}
      onToggle={toggleSidebar}
    />
  );

  const tabsComponent = (
    <Tabs
      tabs={tabs}
      activeKey={activeTab}
      onTabChange={handleTabChange}
      onTabClose={handleTabClose}
    />
  );

  return (
    <Layout 
      sidebar={sidebar}
      tabs={tabsComponent}
      onLogout={logout}
    >
      <Outlet />
    </Layout>
  );
};

export default HomeLayout;
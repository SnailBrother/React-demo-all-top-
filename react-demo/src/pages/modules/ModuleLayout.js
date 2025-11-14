// src/pages/modules/ModuleLayout.js
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/Layout/Header';
import { Tabs, Sidebar, BottomNav } from '../../components/UI';
import KeepAliveOutlet from '../../components/KeepAliveOutlet';
import Player from './music/Player';
import styles from './ModuleLayout.module.css';
import DarkClouds from '../../components/Animation/DarkClouds';// 导入背景组件
import WaterWave from '../../components/Animation/WaterWave';//水滴滚动
import NauticalBackground from '../../components/Animation/NauticalBackground';//路飞出海
import FlowerScene from '../../components/Animation/FlowerScene';//鲜花盛开
import SakuraBackground from '../../components/Animation/SakuraBackground';//樱花飘落
import DetailsHomeBackground from '../../components/Animation/DetailsHomeBackground';//烟花
//import CustomBackground from '../../components/Animation/CustomBackground';//自定义
import CandleAnimation from '../../components/Animation/CandleAnimation';//蜡烛吹灭
import CompassTime from '../../components/Animation/CompassTime';//时间罗盘
import BallLoading from '../../components/Animation/BallLoading';//弹性小球

// 菜单配置 (保持不变)
const moduleMenus = {
  accounting: [
    { key: 'overview', label: '总览', icon: 'icon-guge', path: '/app/accounting/overview' },
    { key: 'transactions', label: '账目', icon: 'icon-guge', path: '/app/accounting/transactions' },
    { key: 'reports', label: '报表', icon: 'icon-guge', path: '/app/accounting/reports' },
  ],
  music: [
    { key: 'home', label: '首页', icon: '#icon-biaoqianA01_shouye-51', path: '/app/music/home' },
    { key: 'recommend', label: '推荐', icon: '#icon-tuijian1', path: '/app/music/recommend' },
    { key: 'recent', label: '最近播放', icon: '#icon-zuijinbofang', path: '/app/music/recent' },
    { key: 'favorites', label: '我的喜欢', icon: '#icon-xihuan11', path: '/app/music/favorites' },
    // { key: 'musicplayerlyrics', label: '歌词', icon: '#icon-xihuan11', path: '/app/music/musicplayerlyrics' },
  ],
  outfit: [
    { key: 'previewwardrobe', label: '查看', icon: 'icon-guge', path: '/app/outfit/previewwardrobe' },
    { key: 'updatewardrobe', label: '更新', icon: 'icon-guge', path: '/app/outfit/updatewardrobe' },
    { key: 'closet', label: '衣橱', icon: 'icon-guge', path: '/app/outfit/closet' },
    { key: 'combos', label: '搭配', icon: 'icon-guge', path: '/app/outfit/combos' },
  ],
  office: [
    { key: 'dashboard', label: '面板', icon: 'icon-guge', path: '/app/office/dashboard' },
    { key: 'docs', label: '文档', icon: 'icon-guge', path: '/app/office/docs' },
    { key: 'tasks', label: '任务', icon: 'icon-guge', path: '/app/office/tasks' },
  ],
  chat: [
    { key: 'conversations', label: '会话', icon: 'icon-guge', path: '/app/chat/conversations' },
    { key: 'contacts', label: '联系人', icon: 'icon-guge', path: '/app/chat/contacts' },
  ],
  system: [
    { key: 'theme', label: '主题设置', icon: 'icon-guge', path: '/app/system/theme' },
    { key: 'profile', label: '个人资料', icon: 'icon-guge', path: '/app/system/profile' },
  ],
};

// 获取模块菜单的辅助函数
const getModuleMenu = (moduleKey) => {
  return moduleMenus[moduleKey] || [];
};

// 主组件
const ModuleLayout = ({ moduleKey, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const menuItems = getModuleMenu(moduleKey);
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [tabs, setTabs] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  // 检测屏幕尺寸
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 根据当前路由和菜单项初始化或更新 tabs
  useEffect(() => {
    const currentPath = location.pathname;
    const currentMenuItem = menuItems.find(item =>
      item.path === currentPath || currentPath.startsWith(item.path + '/')
    );

    if (currentMenuItem) {
      setTabs(prev => {
        const exists = prev.find(tab => tab.key === currentMenuItem.key);
        if (exists) return prev;
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
    if (tab) navigate(tab.path);
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
          if (menuItem) navigate(menuItem.path);
        }
      }
      return newTabs;
    });
  }, [tabs, activeTab, menuItems, navigate]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

   // 统一的布局结构
  return (
    <>
      {/* 背景层 */}
      <div className={styles.backgroundContainer}>
        <DarkClouds />
      </div>
      
      {/* 主布局容器 */}
      <div className={`${styles.unifiedLayout} ${isMobile ? styles.isMobile : styles.isDesktop} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        
        {/* Header (仅桌面端显示) */}
        <div className={styles.headerContainer}>
          <Header onLogout={onLogout} />
        </div>

        {/* 侧边栏 (仅桌面端显示) */}
        <div className={styles.sidebarContainer}>
          <Sidebar
            menuItems={menuItems}
            activeKey={activeTab}
            onMenuClick={handleMenuClick}
            collapsed={sidebarCollapsed}
            onToggle={toggleSidebar}
          />
        </div>

        {/* 主内容区域 (桌面和移动端共用) */}
        <main className={styles.mainContentArea}>
          {/* Tabs (仅桌面端显示) */}
          <div className={styles.tabsContainer}>
            <Tabs
              tabs={tabs}
              activeKey={activeTab}
              onTabChange={handleTabChange}
              onTabClose={handleTabClose}
            />
          </div>
          
          {/* 页面路由内容 */}
          <div className={styles.pageContent}>
            <KeepAliveOutlet />
          </div>
        </main>

        {/* 播放器 (仅音乐模块显示，位置通过CSS控制) */}
        {moduleKey === 'music' && (
          <div className={styles.playerContainer}>
            <Player />
          </div>
        )}
        
        {/* 底部导航 (仅移动端显示) */}
        <div className={styles.bottomNavContainer}>
          <BottomNav
            menuItems={menuItems}
            activeKey={activeTab}
            onMenuClick={handleMenuClick}
          />
        </div>
      </div>
    </>
  );
};

export { moduleMenus, getModuleMenu };
export default ModuleLayout;
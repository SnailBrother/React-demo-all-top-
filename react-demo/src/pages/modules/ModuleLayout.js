// src/pages/modules/ModuleLayout.js

import React from 'react';
import SidebarLayout from '../../components/Layout/SidebarLayout';
import BottomNavLayout from '../../components/Layout/BottomNavLayout';
import styles from './ModuleLayout.module.css';

// 菜单配置
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
  const menuItems = getModuleMenu(moduleKey);

  return (
    <div className={styles.moduleLayout}>
      {/* 桌面端显示侧边栏布局 */}
      <div className={styles.desktopLayout}>
        <SidebarLayout
          menuItems={menuItems}
          moduleKey={moduleKey}
          onLogout={onLogout}
        />
      </div>
      
      {/* 移动端显示底部导航布局 */}
      <div className={styles.mobileLayout}>
        <BottomNavLayout
          menuItems={menuItems}
          moduleKey={moduleKey}
          onLogout={onLogout}
        />
      </div>
    </div>
  );
};

// 导出菜单配置和函数（如果需要其他地方使用）
export { moduleMenus, getModuleMenu };

export default ModuleLayout;
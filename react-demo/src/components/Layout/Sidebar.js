// src/components/Layout/Sidebar.js
import React from 'react';
import IconButton from '../UI/IconButton';
import styles from './Sidebar.module.css';

const MenuItem = ({ 
  item, 
  isActive, 
  isCollapsed, 
  onClick 
}) => {
  return (
    <div 
      className={`${styles.menuItem} ${isActive ? styles.active : ''}`}
      onClick={() => onClick(item)}
      title={isCollapsed ? item.label : ''}
    >
      <span className={styles.menuIcon}>{item.icon}</span>
      {!isCollapsed && (
        <span className={styles.menuLabel}>{item.label}</span>
      )}
      {!isCollapsed && item.children && (
        <span className={styles.arrow}>▶</span>
      )}
    </div>
  );
};

const Sidebar = ({ 
  menuItems = [], 
  activeKey, 
  onMenuClick, 
  collapsed = false,
  onToggle 
}) => {
  return (
    <div className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.sidebarHeader}>
        {!collapsed && <h3 className={styles.sidebarTitle}>首页</h3>}
        <IconButton
          icon={collapsed ? "#icon-zhankaizhedieyou" : "#icon-zhankaizhediezuo"}
          onClick={onToggle}
          title={collapsed ? '展开菜单' : '折叠菜单'}
          variant="ghost"
          size="small"
        />
      </div>
      
      <div className={styles.menu}>
        {menuItems.map(item => (
          <MenuItem
            key={item.key}
            item={item}
            isActive={activeKey === item.key}
            isCollapsed={collapsed}
            onClick={onMenuClick}
          />
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
//src/components/Layout/Sidebar/index.js
import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import styles from './Sidebar.module.css';

const MenuItem = ({ 
  item, 
  isActive, 
  isCollapsed, 
  onClick 
}) => {
  const { theme } = useTheme();

  return (
    <div 
      className={`${styles.menuItem} ${isActive ? styles.active : ''} ${styles[theme]}`}
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
  const { theme } = useTheme();

  return (
    <div className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${styles[theme]}`}>
      <div className={styles.sidebarHeader}>
        {!collapsed && <h3 className={styles.sidebarTitle}>首页</h3>}
        <button 
          className={styles.toggleButton}
          onClick={onToggle}
          title={collapsed ? '展开菜单' : '折叠菜单'}
        >
          {collapsed ? <svg className={styles.Icon} aria-hidden="true">
            <use xlinkHref="#icon-zhankaizhedieyou"></use>
          </svg> : <svg className={styles.Icon} aria-hidden="true">
            <use xlinkHref="#icon-zhankaizhediezuo"></use>
          </svg>}
        </button>
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
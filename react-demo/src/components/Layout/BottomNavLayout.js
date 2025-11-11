// src/components/Layout/BottomNavLayout.js
import React, { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from './index';
import KeepAliveOutlet from '../KeepAliveOutlet';
import styles from './BottomNavLayout.module.css'; // 可以创建新的样式文件或复用原有样式

// 底部导航组件
const BottomNav = ({ menuItems, activeKey, onMenuClick }) => {
  return (
    <div className={styles.bottomNav}>
      {menuItems.map(item => (
        <div
          key={item.key}
          className={`${styles.bottomNavItem} ${activeKey === item.key ? styles.active : ''}`}
          onClick={() => onMenuClick(item)}
        >
          {/* <div className={styles.bottomNavIcon}>{item.icon}</div> */}
           <span className={styles.bottomNavIcon}>
                <svg className={styles.bottomNavSvgIcon} aria-hidden="true">
                    <use xlinkHref={item.icon}></use>
                </svg>
            </span>

          <div className={styles.bottomNavLabel}>{item.label}</div>
        </div>
      ))}
    </div>
  );
};

// 主布局组件
const BottomNavLayout = ({ 
  menuItems = [], 
  moduleKey, 
  onLogout 
}) => {
  const location = useLocation();
  const navigate = useNavigate();

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

  const bottomNavComponent = (
    <BottomNav
      menuItems={menuItems}
      activeKey={activeTab}
      onMenuClick={handleMenuClick}
    />
  );

  return (
    <Layout 
      bottomNav={bottomNavComponent}
      onLogout={onLogout}
    >
      <KeepAliveOutlet />
    </Layout>
  );
};

export default BottomNavLayout;
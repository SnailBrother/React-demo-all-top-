// src/components/UI/BottomNav.js
 
import React from 'react';
import styles from './BottomNav.module.css';

const BottomNav = ({ menuItems, activeKey, onMenuClick }) => {
  return (
    <div className={styles.bottomNav}>
      {menuItems.map(item => (
        <div
          key={item.key}
          className={`${styles.bottomNavItem} ${activeKey === item.key ? styles.active : ''}`}
          onClick={() => onMenuClick(item)}
        >
          <div className={styles.bottomNavIcon}>{item.icon}</div>
          <div className={styles.bottomNavLabel}>{item.label}</div>
        </div>
      ))}
    </div>
  );
};

export default BottomNav;
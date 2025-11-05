//src/components/Layout/index.js
// src/components/Layout/index.js
import React from 'react';
import Header from './Header';
import styles from './Layout.module.css';

const Layout = ({ 
  children, 
  sidebar, 
  tabs,
  bottomNav, // 新增底部导航 prop
  showHeader = true, 
  onLogout 
}) => {
  return (
    <div className={`${styles.layout} ${bottomNav ? styles.withBottomNav : ''}`}>
      {showHeader && <Header onLogout={onLogout} />}
      <div className={styles.mainLayout}>
        {sidebar}
        <div className={`${styles.contentArea} ${bottomNav ? styles.withBottomNav : ''}`}>
          {tabs}
          <main className={styles.mainContent}>
            {children}
          </main>
        </div>
      </div>
      {bottomNav && (
        <div className={styles.bottomNavContainer}>
          {bottomNav}
        </div>
      )}
    </div>
  );
};

export default Layout;
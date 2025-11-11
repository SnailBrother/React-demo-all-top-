// src/components/Layout/index.js
import React from 'react';
import Header from './Header';
import styles from './index.module.css';

const Layout = ({ 
  children, 
  sidebar, 
  tabs,
  bottomNav,
  showHeader = true, 
  onLogout 
}) => {
  const shouldShowHeader = showHeader && sidebar;
  const hasSidebar = !!sidebar;
  const hasBottomNav = !!bottomNav;
  
  return (
    <div className={`${styles.layout}  
      ${hasSidebar ? styles.withSidebar : ''}
      ${hasBottomNav ? styles.withBottomNav : ''}
    `}
    style={{ backgroundColor: 'red' }}  // 内联背景色设置
    
    >
      {shouldShowHeader && <Header onLogout={onLogout} />}
      <div className={styles.mainLayout}>
        {sidebar && sidebar}
        <div className={`
          ${styles.contentArea} 
          ${hasSidebar ? styles.withSidebar : ''}
          ${hasBottomNav ? styles.withBottomNav : ''}
        `}>
          {tabs && tabs}
          <main className={styles.mainContent}
           
          >
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
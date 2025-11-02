//src/components/Layout/index.js
import React from 'react';
import Header from './Header';
import styles from './Layout.module.css';

const Layout = ({ 
  children, 
  sidebar, 
  tabs,
  showHeader = true, 
  onLogout 
}) => {
  return (
    <div className={styles.layout}>
      {showHeader && <Header onLogout={onLogout} />}
      <div className={styles.mainLayout}>
        {sidebar}
        <div className={styles.contentArea}>
          {tabs}
          <main className={styles.mainContent}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
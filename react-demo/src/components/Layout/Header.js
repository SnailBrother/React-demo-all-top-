import React from 'react';
import styles from './Layout.module.css';

const Header = ({ title, onLogout }) => {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
      {onLogout && (
        <button onClick={onLogout} className={styles.logoutButton}>
          退出登录
        </button>
      )}
    </header>
  );
};

export default Header;
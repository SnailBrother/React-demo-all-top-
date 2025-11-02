//src/components/Layout/Header.js
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import styles from './Layout.module.css';

const Header = ({ title = "管理后台", onLogout }) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <header className={`${styles.header} ${styles[theme]}`}> {/* 添加主题类名 */}
      <div className={styles.nav}>
        <h1 className={styles.title}>{title}</h1>
      </div>

      <div className={styles.headerActions}>
        {/* 主题切换按钮 */}
        <button
          className={styles.themeToggle}
          onClick={toggleTheme}
          title={`切换到${theme === 'light' ? '深色' : '浅色'}主题`}
        >
          {theme === 'light' ? <svg className={styles.themeIcon} aria-hidden="true">
            <use xlinkHref="#icon-heiye"></use>
          </svg> : <svg className={styles.themeIcon} aria-hidden="true">
            <use xlinkHref="#icon-baitianmoshi"></use>
          </svg>}
        </button>

        {/* 用户信息 */}
        {user && (
          <span className={styles.userInfo}>
            欢迎, {user.username}
          </span>
        )}

        {/* 退出按钮 */}
        {onLogout && (
          <button onClick={onLogout} className={styles.logoutButton}>
            退出登录
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
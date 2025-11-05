// src/components/Layout/Header.js

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import styles from './Layout.module.css';

const Header = ({ title = "React-Demo" }) => {
  const { theme, toggleTheme, currentCustomTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  console.log('Header user data:', user);
  console.log('Header logout function:', logout);
  console.log('Current theme:', theme, 'Custom theme:', currentCustomTheme);

  const handleSwitchAccount = () => {
    console.log('切换账号按钮被点击');
    if (logout) {
      logout();
    }
    navigate('/login', { replace: true });
  };

  const handleBackToHome = () => {
    console.log('返回首页按钮被点击');
    navigate('/apps', { replace: true });
  };

  // 获取当前主题显示名称
  const getThemeDisplayName = () => {
    if (currentCustomTheme) {
      return `自定义 - ${currentCustomTheme}`;
    }

    const themeNames = {
      light: '浅色',
      dark: '深色',
      female: '女性',
      male: '男性',
      middle: '中年'
    };

    return themeNames[theme] || theme;
  };

  return (
    <header className={`${styles.header} ${styles[theme]}`}>
      <div className={styles.nav}>


        <h1 className={styles.title}>{title}</h1>
        {/* <span style={{ 
          fontSize: '12px', 
          opacity: 0.8,
          background: 'rgba(255,255,255,0.2)',
          padding: '2px 8px',
          borderRadius: '12px'
        }}>
          {getThemeDisplayName()}
        </span> */}
      </div>

      <div className={styles.headerActions}>
        {/* 主题切换按钮 */}
        <button
          className={styles.themeToggle}
          onClick={toggleTheme}
          title={`切换到${theme === 'light' ? '深色' : '浅色'}主题`}
        >
          {theme === 'light' ? (
            <svg className={styles.themeIcon} aria-hidden="true">
              <use xlinkHref="#icon-heiye"></use>
            </svg>
          ) : (
            <svg className={styles.themeIcon} aria-hidden="true">
              <use xlinkHref="#icon-baitianmoshi"></use>
            </svg>
          )}
        </button>
        {/* 返回首页按钮 */}
        <button
          onClick={handleBackToHome}
          className={styles.backButton}
          title="返回首页"
        >
          <svg className={styles.backIcon} aria-hidden="true">
            <use xlinkHref="#icon-home"></use>
          </svg>
        </button>
        {/* 用户信息 */}
        {user && (
          <span className={styles.userInfo}>
            {user.name || user.username || user.email || '用户'}
          </span>
        )}

        <button
          onClick={handleSwitchAccount}
          className={styles.logoutButton}
        >
          切换账号
        </button>
      </div>
    </header>
  );
};

export default Header;
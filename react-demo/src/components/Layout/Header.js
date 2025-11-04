// src/components/Layout/Header.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import styles from './Layout.module.css';

const Header = ({ title = "React-Demo" }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth(); // 直接从 AuthContext 获取 logout
  const navigate = useNavigate();
  
  console.log('Header user data:', user);
  console.log('Header logout function:', logout); // 调试 logout 函数

  const handleSwitchAccount = () => {
    console.log('切换账号按钮被点击');
    if (logout) {
      logout(); // 如果有 logout 函数就调用
    }
    navigate('/login', { replace: true });
  };

  return (
    <header className={`${styles.header} ${styles[theme]}`}>
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
// src/components/Layout/Header.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { IconButton,Span } from '../UI';
import Button from '../UI/Button';
import styles from './Header.module.css';

const Header = ({ title = "React-Demo" }) => {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSwitchAccount = () => {
    if (logout) {
      logout();
    }
    navigate('/login', { replace: true });
  };

  const handleBackToHome = () => {
    navigate('/apps', { replace: true });
  };

  return (
    <header className={styles.header}>
      <div  >
        <h1 className={styles.title}>{title}</h1>
      </div>

      <div className={styles.headerActions}>
        {/* 返回首页按钮 */}
        <IconButton
          icon="#icon-home"
          onClick={handleBackToHome}
          title="返回首页"
          variant="ghost"
          size="medium"
        />
        
        {/* 用户信息 */}
        {user && (
          <Span     >
            {user.username || user.email || '用户'}
          </Span>
        )}

        <Button
          onClick={handleSwitchAccount}
          variant="secondary"
          size="small"
        >
          切换账号
        </Button>
      </div>
    </header>
  );
};

export default Header;
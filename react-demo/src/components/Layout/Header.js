// src/components/Layout/Header.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { IconButton,Span } from '../UI';
import Button from '../UI/Button';
import styles from './Header.module.css';








const Header = ({ title = "React-Demo" }) => {
  const { user, logout } = useAuth(); // 直接使用 context 提供的 logout 函数
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate('/apps', { replace: true });
  };

  return (
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>{title}</h1>
      </div>

      <div className={styles.headerActions}>
        <IconButton
          icon="#icon-home"
          onClick={handleBackToHome}
          title="返回首页"
          variant="ghost"
          size="medium"
        />
        
        {user && (
          <Span>
            {user.username || user.email || '用户'}
          </Span>
        )}

        {/* 点击时直接调用从 context 来的 logout 函数 */}
        <Button
          onClick={logout}
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
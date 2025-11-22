// src/components/Layout/Header.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { IconButton, Span } from '../UI';
import Button from '../UI/Button';
import styles from './Header.module.css';

const Header = ({ title = "React-Demo" }) => {
  const { user, logout } = useAuth(); // 直接使用 context 提供的 logout 函数
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate('/apps', { replace: true });
  };

    const handlethemset = () => {
    navigate('/app/chat/conversations', { replace: true });
  };

  return (
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>{title}</h1>
      </div>

      <div className={styles.headerActions}>
        <IconButton
          icon="#icon-shouye3"
          onClick={handleBackToHome}
          title="返回首页"
          variant="ghost"
          size="medium"
        />
        <IconButton
          icon="#icon-user-01"
          onClick={handleBackToHome}
          title={user.username || user.email || '用户'}
          variant="ghost"
          size="medium"

        />

        {/* {user && (
          <Span>
            {user.username || user.email || '用户'}
          </Span>
        )} */}

        <IconButton
          icon="#icon-tongzhi7"
          onClick={handleBackToHome}
          title="返回首页"
          variant="ghost"
          size="medium"
        />
        {/* 点击时直接调用从 context 来的 logout 函数 */}
        <IconButton
          icon="#icon-shezhi2"
          onClick={handlethemset}
          title="主题设置"
          variant="ghost"
          size="medium"
        />

        <IconButton
          icon="#icon-zhuti1"
          onClick={logout}
          title="切换账号"
          variant="ghost"
          size="medium"
        />

      </div>
    </header>
  );
};

export default Header;
//// src/components/UI/Tabs/index.js
import React from 'react';
import { useTheme } from '../../../context/ThemeContext'; // 导入主题hook
import styles from './Tabs.module.css';

const Tab = ({ 
  tab, 
  isActive, 
  onSelect, 
  onClose, 
  closable = true 
}) => {
  const { theme } = useTheme();

  const handleClick = (e) => {
    e.preventDefault();
    onSelect(tab.key);
  };

  const handleClose = (e) => {
    e.stopPropagation();
    onClose(tab.key);
  };

  return (
    <div 
      className={`${styles.tab} ${isActive ? styles.active : ''} ${styles[theme]}`}
      onClick={handleClick}
    >
      <span className={styles.tabIcon}>{tab.icon}</span>
      <span className={styles.tabLabel}>{tab.label}</span>
      {closable && (
        <button 
          className={styles.closeButton}
          onClick={handleClose}
          title="关闭标签"
        >
          ×
        </button>
      )}
    </div>
  );
};

const Tabs = ({ 
  tabs = [], 
  activeKey, 
  onTabChange, 
  onTabClose 
}) => {
  const { theme } = useTheme();
  
  // 只有当有多个标签页时才允许关闭
  const canClose = tabs.length > 1;

  return (
    <div className={`${styles.tabsContainer} ${styles[theme]}`}>
      <div className={styles.tabsList}>
        {tabs.map(tab => (
          <Tab
            key={tab.key}
            tab={tab}
            isActive={tab.key === activeKey}
            onSelect={onTabChange}
            onClose={onTabClose}
            closable={canClose} // 根据标签页数量决定是否可关闭
          />
        ))}
      </div>
    </div>
  );
};

export default Tabs;
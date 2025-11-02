import React, { useState, useEffect } from 'react';
import { Button, Input } from '../../../components/UI';
//import { useTheme } from '../../../../context';
import { useTheme } from '../../../context';
import styles from '../home.module.css';

const Settings = () => {
  const { theme, changeTheme } = useTheme();
  const [settings, setSettings] = useState({
    siteName: '我的应用',
    language: 'zh-CN',
    theme: theme, // 使用当前主题
    notifications: true
  });

  // 当主题上下文变化时更新本地状态
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      theme: theme
    }));
  }, [theme]);

  const handleThemeChange = (newTheme) => {
    changeTheme(newTheme);
  };

  const handleSave = () => {
    // 保存设置逻辑
    console.log('保存设置:', settings);
    // 这里可以添加API调用保存设置到服务器
  };

  const handleReset = () => {
    // 重置为主题上下文中的当前主题
    setSettings(prev => ({
      ...prev,
      theme: theme
    }));
  };

  return (
    <div className={styles.pageContent}>
      <div className={styles.pageHeader}>
        <h2>系统设置</h2>
        <p>配置应用程序设置</p>
      </div>
      
      <div className={styles.settingsForm}>
        <div className={styles.formSection}>
          <h3>基本设置</h3>
          <div className={styles.formGroup}>
            <label>站点名称</label>
            <Input
              value={settings.siteName}
              onChange={(e) => setSettings({...settings, siteName: e.target.value})}
              placeholder="输入站点名称"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>语言</label>
            <select 
              value={settings.language}
              onChange={(e) => setSettings({...settings, language: e.target.value})}
              className={styles.selectInput}
            >
              <option value="zh-CN">中文</option>
              <option value="en-US">English</option>
              <option value="ja-JP">日本語</option>
            </select>
          </div>
        </div>
        
        <div className={styles.formSection}>
          <h3>界面设置</h3>
          <div className={styles.radioGroup}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                value="light"
                checked={settings.theme === 'light'}
                onChange={(e) => handleThemeChange(e.target.value)}
              />
              <span>浅色主题</span>
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                value="dark"
                checked={settings.theme === 'dark'}
                onChange={(e) => handleThemeChange(e.target.value)}
              />
              <span>深色主题</span>
            </label>
          </div>
          <p className={styles.themeHint}>
            当前主题: {settings.theme === 'light' ? '浅色' : '深色'}
          </p>
        </div>
        
        <div className={styles.formSection}>
          <h3>通知设置</h3>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={settings.notifications}
              onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
            />
            <span>启用邮件通知</span>
          </label>
        </div>
        
        <div className={styles.formActions}>
          <Button variant="primary" onClick={handleSave}>
            保存设置
          </Button>
          <Button variant="secondary" onClick={handleReset}>
            重置
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
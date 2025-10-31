import React, { useState } from 'react';
import { Button, Input } from '../../../components/UI';
import styles from '../home.module.css';

const Settings = () => {
  const [settings, setSettings] = useState({
    siteName: '我的应用',
    language: 'zh-CN',
    theme: 'light',
    notifications: true
  });

  const handleSave = () => {
    // 保存设置逻辑
    console.log('保存设置:', settings);
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
                onChange={(e) => setSettings({...settings, theme: e.target.value})}
              />
              <span>浅色主题</span>
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                value="dark"
                checked={settings.theme === 'dark'}
                onChange={(e) => setSettings({...settings, theme: e.target.value})}
              />
              <span>深色主题</span>
            </label>
          </div>
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
          <Button variant="secondary">
            重置
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
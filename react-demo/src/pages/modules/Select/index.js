// src/pages/modules/Select/index
// src/pages/modules/Select/index
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './select.module.css';

const modules = [
  { 
    key: 'accounting', 
    title: '记账', 
    desc: '管理账本与报表', 
    emoji: '📒',
    defaultPath: '/app/accounting/overview'
  },
  { 
    key: 'music', 
    title: '音乐', 
    desc: '收藏与播放音乐', 
    emoji: '🎵',
    defaultPath: '/app/music/library'
  },
  { 
    key: 'outfit', 
    title: '穿搭', 
    desc: '穿搭与衣橱管理', 
    emoji: '👗',
    defaultPath: '/app/outfit/closet'
  },
  { 
    key: 'office', 
    title: '办公', 
    desc: '日程与文档处理', 
    emoji: '💼',
    defaultPath: '/app/office/dashboard'
  },
  { 
    key: 'chat', 
    title: '聊天', 
    desc: '沟通与消息中心', 
    emoji: '💬',
    defaultPath: '/app/chat/conversations'
  },
  { 
    key: 'system', 
    title: '系统设置', 
    desc: '主题与个性化', 
    emoji: '⚙️',
    defaultPath: '/app/system/theme'
  },
];

const ModuleSelect = () => {
  const navigate = useNavigate();

  const go = (defaultPath) => navigate(defaultPath);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        {/* <h1>选择一个模块</h1>
        <p>登录成功，选择要进入的功能板块</p> */}
      </div>
      <div className={styles.grid}>
        {modules.map(m => (
          <button key={m.key} className={styles.card} onClick={() => go(m.defaultPath)}>
            <div className={styles.icon}>{m.emoji}</div>
            <div className={styles.title}>{m.title}</div>
            <div className={styles.desc}>{m.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ModuleSelect;


import React, { useState } from 'react';
import { Button, Input, Modal } from '../../../components/UI';
import styles from '../home.module.css';

const Messages = () => {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      title: '系统通知', 
      content: '系统将于今晚 24:00 进行维护升级，预计耗时2小时。', 
      sender: '系统管理员', 
      time: '2024-01-15 14:30', 
      read: false,
      type: 'system'
    },
    { 
      id: 2, 
      title: '新订单提醒', 
      content: '您有一个新的订单 #12345 等待处理。', 
      sender: '订单系统', 
      time: '2024-01-15 13:15', 
      read: true,
      type: 'order'
    },
    { 
      id: 3, 
      title: '账户安全提醒', 
      content: '检测到您的账户在新的设备上登录，请确认是否为本人操作。', 
      sender: '安全中心', 
      time: '2024-01-15 10:45', 
      read: true,
      type: 'security'
    },
    { 
      id: 4, 
      title: '版本更新通知', 
      content: '新版本 v2.1.0 已发布，包含多项功能优化和问题修复。', 
      sender: '开发团队', 
      time: '2024-01-14 16:20', 
      read: false,
      type: 'update'
    }
  ]);

  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');

  const handleMessageClick = (message) => {
    setSelectedMessage(message);
    setShowModal(true);
    
    // 标记为已读
    if (!message.read) {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === message.id ? { ...msg, read: true } : msg
        )
      );
    }
  };

  const handleDeleteMessage = (messageId, e) => {
    e.stopPropagation();
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    if (selectedMessage && selectedMessage.id === messageId) {
      setSelectedMessage(null);
      setShowModal(false);
    }
  };

  const markAllAsRead = () => {
    setMessages(prev => 
      prev.map(msg => ({ ...msg, read: true }))
    );
  };

  const getFilteredMessages = () => {
    if (filter === 'all') return messages;
    if (filter === 'unread') return messages.filter(msg => !msg.read);
    return messages.filter(msg => msg.type === filter);
  };

  const getMessageTypeIcon = (type) => {
    const icons = {
      system: '🔔',
      order: '📦',
      security: '🔒',
      update: '🔄'
    };
    return icons[type] || '📧';
  };

  const getMessageTypeLabel = (type) => {
    const labels = {
      system: '系统通知',
      order: '订单提醒',
      security: '安全提醒',
      update: '版本更新'
    };
    return labels[type] || '消息';
  };

  const unreadCount = messages.filter(msg => !msg.read).length;

  return (
    <div className={styles.pageContent}>
      <div className={styles.pageHeader}>
        <div className={styles.headerRow}>
          <div>
            <h2>消息中心</h2>
            <p>查看和管理系统消息和通知</p>
          </div>
          <div className={styles.headerActions}>
            {unreadCount > 0 && (
              <span className={styles.unreadBadge}>
                {unreadCount} 条未读
              </span>
            )}
            <Button 
              variant="primary" 
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              全部标记已读
            </Button>
          </div>
        </div>
      </div>

      {/* 筛选器 */}
      <div className={styles.filterTabs}>
        <button 
          className={`${styles.filterTab} ${filter === 'all' ? styles.active : ''}`}
          onClick={() => setFilter('all')}
        >
          全部消息
        </button>
        <button 
          className={`${styles.filterTab} ${filter === 'unread' ? styles.active : ''}`}
          onClick={() => setFilter('unread')}
        >
          未读消息
        </button>
        <button 
          className={`${styles.filterTab} ${filter === 'system' ? styles.active : ''}`}
          onClick={() => setFilter('system')}
        >
          系统通知
        </button>
        <button 
          className={`${styles.filterTab} ${filter === 'order' ? styles.active : ''}`}
          onClick={() => setFilter('order')}
        >
          订单提醒
        </button>
      </div>

      {/* 消息列表 */}
      <div className={styles.messagesList}>
        {getFilteredMessages().length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📭</div>
            <h3>暂无消息</h3>
            <p>当有新消息时，它们会显示在这里</p>
          </div>
        ) : (
          getFilteredMessages().map(message => (
            <div 
              key={message.id}
              className={`${styles.messageItem} ${!message.read ? styles.unread : ''}`}
              onClick={() => handleMessageClick(message)}
            >
              <div className={styles.messageIcon}>
                {getMessageTypeIcon(message.type)}
              </div>
              <div className={styles.messageContent}>
                <div className={styles.messageHeader}>
                  <h4 className={styles.messageTitle}>{message.title}</h4>
                  <span className={styles.messageTime}>{message.time}</span>
                </div>
                <p className={styles.messagePreview}>
                  {message.content}
                </p>
                <div className={styles.messageMeta}>
                  <span className={styles.messageSender}>来自：{message.sender}</span>
                  <span className={styles.messageType}>
                    {getMessageTypeLabel(message.type)}
                  </span>
                </div>
              </div>
              <div className={styles.messageActions}>
                {!message.read && <div className={styles.unreadDot}></div>}
                <Button 
                  variant="danger" 
                  size="small"
                  onClick={(e) => handleDeleteMessage(message.id, e)}
                >
                  删除
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 消息详情模态框 */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedMessage?.title}
        showFooter={false}
      >
        {selectedMessage && (
          <div className={styles.messageDetail}>
            <div className={styles.detailHeader}>
              <div className={styles.detailMeta}>
                <span className={styles.detailSender}>
                  <strong>发件人：</strong>{selectedMessage.sender}
                </span>
                <span className={styles.detailTime}>
                  <strong>时间：</strong>{selectedMessage.time}
                </span>
                <span className={styles.detailType}>
                  <strong>类型：</strong>{getMessageTypeLabel(selectedMessage.type)}
                </span>
              </div>
            </div>
            <div className={styles.detailContent}>
              {selectedMessage.content}
            </div>
            <div className={styles.detailActions}>
              <Button 
                variant="danger" 
                onClick={() => handleDeleteMessage(selectedMessage.id, { stopPropagation: () => {} })}
              >
                删除消息
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => setShowModal(false)}
              >
                关闭
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Messages;
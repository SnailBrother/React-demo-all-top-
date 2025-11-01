import React, { useState, useEffect, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import styles from './Message.module.css';

const MessageContext = createContext();

export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
};

const MessageItem = ({ message, onClose }) => {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (message.duration) {
      const timer = setTimeout(() => {
        setIsLeaving(true);
        setTimeout(() => onClose(message.id), 300);
      }, message.duration);

      return () => clearTimeout(timer);
    }
  }, [message.duration, message.id, onClose]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => onClose(message.id), 300);
  };

  return (
    <div className={`${styles.message} ${styles[message.type]} ${isLeaving ? styles.leaving : ''}`}>
      <div className={styles.messageContent}>{message.content}</div>
      <button className={styles.closeButton} onClick={handleClose}>
        ×
      </button>
    </div>
  );
};

export const MessageProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);

  const addMessage = (message) => {
    const id = Date.now().toString();
    const newMessage = {
      id,
      type: 'info',
      duration: 3000,
      ...message,
    };
    setMessages(prev => [...prev, newMessage]);
    return id;
  };

  const removeMessage = (id) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const messageApi = {
    info: (content, options) => addMessage({ type: 'info', content, ...options }),
    success: (content, options) => addMessage({ type: 'success', content, ...options }),
    warning: (content, options) => addMessage({ type: 'warning', content, ...options }),
    error: (content, options) => addMessage({ type: 'error', content, ...options }),
  };

  const contextValue = {
    messages,
    addMessage,
    removeMessage,
    ...messageApi
  };

  return (
    <MessageContext.Provider value={contextValue}>
      {children}
      {createPortal(
        <div className={styles.messageContainer}>
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              onClose={removeMessage}
            />
          ))}
        </div>,
        document.body
      )}
    </MessageContext.Provider>
  );
};

export default MessageProvider;
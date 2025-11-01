// src/components/UI/Button/index.js
import React from 'react';
import styles from './Button.module.css';

const Button = ({ 
  children, 
  type = 'button', 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  className = '',
  ...props 
}) => {
  const buttonClass = `${styles.button} ${styles[variant]} ${styles[size]} ${
    fullWidth ? styles.fullWidth : ''
  } ${loading ? styles.loading : ''} ${className}`;
  
  return (
    <button
      type={type}
      className={buttonClass}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? '加载中...' : children}
    </button>
  );
};

// 同时提供命名导出和默认导出
export { Button };
export default Button;
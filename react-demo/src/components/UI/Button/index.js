import React from 'react';
import styles from './Button.module.css';

const Button = ({ 
  children, 
  type = 'button', 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  onClick,
  className = '',
  ...props 
}) => {
  const buttonClass = `${styles.button} ${styles[variant]} ${styles[size]} ${className}`;
  
  return (
    <button
      type={type}
      className={buttonClass}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
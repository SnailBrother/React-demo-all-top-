import React from 'react';
import styles from './Input.module.css';

const Input = ({
  type = 'text',
  placeholder = '',
  value,
  onChange,
  disabled = false,
  error = '',
  label = '',
  className = '',
  ...props
}) => {
  return (
    <div className={`${styles.inputContainer} ${className}`}>
      {label && <label className={styles.label}>{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`${styles.input} ${error ? styles.error : ''}`}
        {...props}
      />
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
};

export default Input;
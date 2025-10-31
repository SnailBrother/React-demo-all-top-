import React from 'react';
import ReactDOM from 'react-dom';
import Button from '../Button';
import styles from './Modal.module.css';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  showFooter = true,
  onConfirm,
  confirmText = '确认',
  cancelText = '取消',
  confirmLoading = false
}) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{title}</h3>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.modalBody}>
          {children}
        </div>
        
        {showFooter && (
          <div className={styles.modalFooter}>
            <Button variant="secondary" onClick={onClose}>
              {cancelText}
            </Button>
            <Button 
              variant="primary" 
              onClick={onConfirm}
              disabled={confirmLoading}
            >
              {confirmLoading ? '加载中...' : confirmText}
            </Button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
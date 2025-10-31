import React, { useState } from 'react';
import { Button, Input, Modal } from '../../../components/UI';
import styles from '../home.module.css';

const UserManagement = () => {
  const [users] = useState([
    { id: 1, name: '张三', email: 'zhangsan@example.com', role: '管理员', status: '活跃' },
    { id: 2, name: '李四', email: 'lisi@example.com', role: '用户', status: '活跃' },
    { id: 3, name: '王五', email: 'wangwu@example.com', role: '用户', status: '禁用' },
  ]);
  
  const [showModal, setShowModal] = useState(false);

  return (
    <div className={styles.pageContent}>
      <div className={styles.pageHeader}>
        <h2>用户管理</h2>
        <p>管理系统用户和权限</p>
      </div>
      
      <div className={styles.toolbar}>
        <Input 
          placeholder="搜索用户..."
          className={styles.searchInput}
        />
        <Button 
          variant="primary" 
          onClick={() => setShowModal(true)}
        >
          添加用户
        </Button>
      </div>
      
      <div className={styles.tableContainer}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>姓名</th>
              <th>邮箱</th>
              <th>角色</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`${styles.roleBadge} ${
                    user.role === '管理员' ? styles.roleAdmin : styles.roleUser
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${
                    user.status === '活跃' ? styles.statusActive : styles.statusInactive
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td>
                  <div className={styles.actionButtons}>
                    <Button variant="secondary" size="small">编辑</Button>
                    <Button variant="danger" size="small">删除</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="添加用户"
      >
        <div className={styles.modalContent}>
          <p>添加用户的功能表单将在这里显示...</p>
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              取消
            </Button>
            <Button variant="primary">
              确认添加
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;
import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { Input, Button } from '../../../components/UI';
import Layout from '../../../components/Layout';
import styles from './register.module.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const { register, loading } = useAuth();

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username) {
      newErrors.username = '用户名不能为空';
    }
    
    if (!formData.email) {
      newErrors.email = '邮箱不能为空';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '邮箱格式不正确';
    }
    
    if (!formData.password) {
      newErrors.password = '密码不能为空';
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少6位';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '请确认密码';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次密码不一致';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        await register(formData.username, formData.email, formData.password);
      } catch (error) {
        setErrors({ submit: error.message });
      }
    }
  };

  return (
    <Layout title="用户注册" showHeader={false}>
      <div className={styles.registerContainer}>
        <form className={styles.registerForm} onSubmit={handleSubmit}>
          <h2 className={styles.title}>用户注册</h2>
          
          <Input
            label="用户名"
            placeholder="请输入用户名"
            value={formData.username}
            onChange={(e) => handleChange('username', e.target.value)}
            error={errors.username}
          />
          
          <Input
            type="email"
            label="邮箱"
            placeholder="请输入邮箱"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            error={errors.email}
          />
          
          <Input
            type="password"
            label="密码"
            placeholder="请输入密码"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            error={errors.password}
          />
          
          <Input
            type="password"
            label="确认密码"
            placeholder="请再次输入密码"
            value={formData.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            error={errors.confirmPassword}
          />
          
          {errors.submit && (
            <div className={styles.submitError}>{errors.submit}</div>
          )}
          
          <Button 
            type="submit" 
            variant="primary" 
            size="large" 
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? '注册中...' : '注册'}
          </Button>
        </form>
      </div>
    </Layout>
  );
};

export default Register;
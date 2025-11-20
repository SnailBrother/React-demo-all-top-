// src/pages/user/register/index.js
// src/pages/user/register/index.js
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import styles from './register.module.css';

const Register = () => {
    const navigate = useNavigate();
    const { setUserInfo } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleInputChange = (field, value) => {
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
            setLoading(true);
            try {
                // 直接使用 axios 调用注册接口
                const response = await axios.post('/api/auth/register', {
                    username: formData.username,
                    email: formData.email,
                    password: formData.password
                });

                console.log('注册响应:', response.data);

                if (response.data.success) {
                    // 注册成功后跳转到登录页面并携带消息
                    navigate('/login', { 
                        state: { 
                            message: '注册成功！请使用您的账户登录。',
                            email: formData.email // 可选：预填充邮箱
                        } 
                    });
                } else {
                    throw new Error(response.data.message || '注册失败');
                }
            } catch (error) {
                console.error('注册错误:', error);
                let errorMessage = '注册失败，请稍后重试';
                
                if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                } else if (error.message) {
                    errorMessage = error.message;
                }
                
                setErrors({ submit: errorMessage });
            } finally {
                setLoading(false);
            }
        }
    };

    const goToLogin = () => {
        navigate('/login');
    };

    return (
        <div className={styles.registerContainer}>
            <div className={styles.registerBackground}>
                <div className={styles.registerShapes}>
                    <div className={styles.shape1}></div>
                    <div className={styles.shape2}></div>
                    <div className={styles.shape3}></div>
                </div>
            </div>

            <div className={styles.registerCard}>
                <div className={styles.registerHeader}>
                    <div className={styles.registerLogo}>
                        <span className={styles.logoIcon}>
                            <svg className={styles.githublogoIcon} aria-hidden="true">
                                <use xlinkHref="#icon-github"></use>
                            </svg>
                        </span>
                        <h1>Rect Demo</h1>
                    </div>
                    <p className={styles.registerSubtitle}>
                        创建新账户，开始使用我们的服务
                    </p>
                </div>

                <form className={styles.registerForm} onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label htmlFor="username" className={styles.formLabel}>用户名</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={(e) => handleInputChange('username', e.target.value)}
                            className={`${styles.formInput} ${errors.username ? styles.inputError : ''}`}
                            placeholder="请输入用户名"
                            required
                        />
                        {errors.username && <span className={styles.errorMessage}>{errors.username}</span>}
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="email" className={styles.formLabel}>邮箱地址</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className={`${styles.formInput} ${errors.email ? styles.inputError : ''}`}
                            placeholder="请输入邮箱地址"
                            required
                        />
                        {errors.email && <span className={styles.errorMessage}>{errors.email}</span>}
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="password" className={styles.formLabel}>密码</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            className={`${styles.formInput} ${errors.password ? styles.inputError : ''}`}
                            placeholder="请输入密码"
                            required
                        />
                        {errors.password && <span className={styles.errorMessage}>{errors.password}</span>}
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="confirmPassword" className={styles.formLabel}>确认密码</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                            className={`${styles.formInput} ${errors.confirmPassword ? styles.inputError : ''}`}
                            placeholder="请再次输入密码"
                            required
                        />
                        {errors.confirmPassword && <span className={styles.errorMessage}>{errors.confirmPassword}</span>}
                    </div>

                    {errors.submit && (
                        <div className={styles.submitError}>{errors.submit}</div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`${styles.registerButton} ${loading ? styles.loading : ''}`}
                    >
                        {loading ? '注册中...' : '注册'}
                    </button>
                </form>

                <div className={styles.registerFooter}>
                    <p className={styles.switchMode}>
                        已有账户？
                        <button
                            type="button"
                            onClick={goToLogin}
                            className={styles.switchButton}
                        >
                            立即登录
                        </button>
                    </p>

                    <div className={styles.divider}>
                        <span>或</span>
                    </div>

                    <div className={styles.socialRegister}>
                        <button
                            type="button"
                            className={styles.socialButton}
                        >
                            <span className={styles.socialIcon}>
                                <svg className={styles.githublogoIcon} aria-hidden="true">
                                    <use xlinkHref="#icon-qitadenglu_QQdenglu_hover"></use>
                                </svg>
                            </span>
                            使用 QQ 注册
                        </button>
                        <button
                            type="button"
                            className={styles.socialButton}
                        >
                            <span className={styles.socialIcon}>
                                <svg className={styles.githublogoIcon} aria-hidden="true">
                                    <use xlinkHref="#icon-denglu-weixindenglu"></use>
                                </svg>
                            </span>
                            使用 微信 注册
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
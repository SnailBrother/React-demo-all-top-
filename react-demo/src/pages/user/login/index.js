//  src/pages/user/login/index.js
import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/UI'; 
import styles from './login.module.css';

const Login = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({});
    const { login, loading } = useAuth();

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

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (validateForm()) {
            try {
                await login(formData.email, formData.password);
                // 登录成功后跳转
                const from = location.state?.from?.pathname || '/apps';
                navigate(from, { replace: true });
            } catch (error) {
                setErrors({ submit: error.message });
            }
        }
    };

    const goToRegister = () => {
        navigate('/register');
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginBackground}>
                <div className={styles.loginShapes}>
                    <div className={styles.shape1}></div>
                    <div className={styles.shape2}></div>
                    <div className={styles.shape3}></div>
                </div>
            </div>

            <div className={styles.loginCard}>
                <div className={styles.loginHeader}>
                    <div className={styles.loginLogo}>
                        <span className={styles.logoIcon}>
                            <svg className={styles.githublogoIcon} aria-hidden="true">
                                <use xlinkHref="#icon-github"></use>
                            </svg>
                        </span>
                        <h1>Rect Demo</h1>
                    </div>
                    <p className={styles.loginSubtitle}>
                        欢迎回来，请登录您的账户
                    </p>
                </div>

                <form className={styles.loginForm} onSubmit={handleSubmit}>
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

                    <div className={styles.formOptions}>
                        <label className={styles.checkboxLabel}>
                            <input type="checkbox" className={styles.checkboxInput} />
                            <span className={styles.checkboxText}>记住我</span>
                        </label>
                        <a href="#" className={styles.forgotLink}>忘记密码？</a>
                    </div>

                    {errors.submit && (
                        <div className={styles.submitError}>{errors.submit}</div>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        size="large"
                        fullWidth
                        loading={loading}
                        className={styles.loginButton}
                    >
                        {loading ? '登录中...' : '登录'}
                    </Button>
                </form>

                <div className={styles.loginFooter}>
                    <p className={styles.switchMode}>
                        还没有账户？
                        <Button
                            type="button"
                            variant="text"
                            onClick={goToRegister}
                            className={styles.switchButton}
                        >
                            立即注册
                        </Button>
                    </p>

                    <div className={styles.divider}>
                        <span>或</span>
                    </div>

                    <div className={styles.socialLogin}>
                        <Button
                            type="button"
                            variant="secondary"
                            fullWidth
                            className={styles.socialButton}
                        >
                            <span className={styles.socialIcon}>
                                <svg className={styles.githublogoIcon} aria-hidden="true">
                                    <use xlinkHref="#icon-qitadenglu_QQdenglu_hover"></use>
                                </svg>
                            </span>
                            使用 QQ 登录
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            fullWidth
                            className={styles.socialButton}
                        >
                            <span className={styles.socialIcon}>
                                <svg className={styles.githublogoIcon} aria-hidden="true">
                                    <use xlinkHref="#icon-denglu-weixindenglu"></use>
                                </svg>
                            </span>
                            使用 微信 登录
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
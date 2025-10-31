import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { Input, Button } from '../../../components/UI';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './login.module.css';

const Login = () => {
    const location = useLocation();

    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const { login, register, loading } = useAuth();

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

        if (!isLogin && !formData.username) {
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

        if (!isLogin) {
            if (!formData.confirmPassword) {
                newErrors.confirmPassword = '请确认密码';
            } else if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = '两次密码不一致';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 在 handleSubmit 函数中，登录成功后：
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (validateForm()) {
            try {
                if (isLogin) {
                    await login(formData.email, formData.password);
                    // 登录成功后，使用 navigate 跳转
                    const from = location.state?.from?.pathname || '/dashboard';
                    navigate(from, { replace: true });
                } else {
                    await register(formData.username, formData.email, formData.password);
                    // 注册成功后自动切换到登录模式
                    setIsLogin(true);
                    setFormData({
                        username: '',
                        email: '',
                        password: '',
                        confirmPassword: ''
                    });
                }
            } catch (error) {
                setErrors({ submit: error.message });
            }
        }
    };

    const switchMode = () => {
        setIsLogin(!isLogin);
        setFormData({
            username: '',
            email: '',
            password: '',
            confirmPassword: ''
        });
        setErrors({});
    };

    const navigate = (path) => {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
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
                        {isLogin ? '欢迎回来，请登录您的账户' : '创建新账户，开始使用我们的服务'}
                    </p>
                </div>

                <form className={styles.loginForm} onSubmit={handleSubmit}>
                    {!isLogin && (
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
                                required={!isLogin}
                            />
                            {errors.username && <span className={styles.errorMessage}>{errors.username}</span>}
                        </div>
                    )}

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

                    {!isLogin && (
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
                                required={!isLogin}
                            />
                            {errors.confirmPassword && <span className={styles.errorMessage}>{errors.confirmPassword}</span>}
                        </div>
                    )}

                    {isLogin && (
                        <div className={styles.formOptions}>
                            <label className={styles.checkboxLabel}>
                                <input type="checkbox" className={styles.checkboxInput} />
                                <span className={styles.checkboxText}>记住我</span>
                            </label>
                            <a href="#" className={styles.forgotLink}>忘记密码？</a>
                        </div>
                    )}

                    {errors.submit && (
                        <div className={styles.submitError}>{errors.submit}</div>
                    )}

                    <button
                        type="submit"
                        className={styles.loginButton}
                        disabled={loading}
                    >
                        {loading ? (isLogin ? '登录中...' : '注册中...') : (isLogin ? '登录' : '注册')}
                    </button>
                </form>

                <div className={styles.loginFooter}>
                    <p className={styles.switchMode}>
                        {isLogin ? '还没有账户？' : '已有账户？'}
                        <button type="button" className={styles.switchButton} onClick={switchMode}>
                            {isLogin ? '立即注册' : '立即登录'}
                        </button>
                    </p>

                    <div className={styles.divider}>
                        <span>或</span>
                    </div>

                    <div className={styles.socialLogin}>
                        <button type="button" className={styles.socialButtonGoogle}>
                            <span className={styles.socialIcon}>
                                <svg className={styles.githublogoIcon} aria-hidden="true">
                                    <use xlinkHref="#icon-qitadenglu_QQdenglu_hover"></use>
                                </svg>
                            </span>
                            使用 QQ 登录
                        </button>
                        <button type="button" className={styles.socialButtonGithub}>
                            <span className={styles.socialIcon}>
                                <svg className={styles.githublogoIcon} aria-hidden="true">
                                    <use xlinkHref="#icon-denglu-weixindenglu"></use>
                                </svg>
                            </span>
                            使用 微信 登录
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
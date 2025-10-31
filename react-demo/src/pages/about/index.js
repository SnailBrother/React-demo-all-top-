import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/Layout';
import styles from './about.module.css';

const About = () => {
  const { user } = useAuth();

  return (
    <Layout title="关于我们">
      <div className={styles.about}>
        <div className={styles.hero}>
          <h1>关于 React DEMO</h1>
          <p>这是一个展示现代React开发最佳实践的示例项目</p>
        </div>
        
        <div className={styles.content}>
          <section className={styles.section}>
            <h2>项目特性</h2>
            <div className={styles.features}>
              <div className={styles.feature}>
                <h3>🚀 现代化架构</h3>
                <p>采用最新的React Hooks和函数式组件</p>
              </div>
              <div className={styles.feature}>
                <h3>🎨 组件化设计</h3>
                <p>高度可复用的UI组件和业务组件</p>
              </div>
              <div className={styles.feature}>
                <h3>🔐 安全认证</h3>
                <p>完整的用户认证和路由保护机制</p>
              </div>
              <div className={styles.feature}>
                <h3>📱 响应式布局</h3>
                <p>完美适配各种屏幕尺寸</p>
              </div>
            </div>
          </section>
          
          <section className={styles.section}>
            <h2>技术栈</h2>
            <div className={styles.techStack}>
              <span className={styles.tech}>React 18</span>
              <span className={styles.tech}>React Router</span>
              <span className={styles.tech}>Context API</span>
              <span className={styles.tech}>CSS Modules</span>
              <span className={styles.tech}>自定义 Hooks</span>
            </div>
          </section>
          
          {user && (
            <section className={styles.section}>
              <h2>用户信息</h2>
              <div className={styles.userInfo}>
                <p><strong>用户名:</strong> {user.username}</p>
                <p><strong>邮箱:</strong> {user.email}</p>
                <p><strong>登录时间:</strong> {new Date(user.loginTime).toLocaleString()}</p>
              </div>
            </section>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default About;
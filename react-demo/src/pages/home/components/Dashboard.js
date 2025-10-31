import React from 'react';
import { Button } from '../../../components/UI';
import { useNavigate } from 'react-router-dom';
import styles from '../home.module.css';

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.pageContent}>
      <div className={styles.pageHeader}>
        <h2>仪表板</h2>
        <p>系统概览和关键指标</p>
      </div>
      
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>用户数量</h3>
          <div className={styles.statNumber}>1,234</div>
          <div className={styles.statTrend}>↑ 12% 较上月</div>
          <Button 
            variant="primary" 
            size="small"
            onClick={() => navigate('/users')}
            style={{ marginTop: '12px' }}
          >
            查看用户
          </Button>
        </div>
        
        <div className={styles.statCard}>
          <h3>订单数量</h3>
          <div className={styles.statNumber}>567</div>
          <div className={styles.statTrend}>↑ 8% 较上月</div>
        </div>
        
        <div className={styles.statCard}>
          <h3>收入</h3>
          <div className={styles.statNumber}>¥89,000</div>
          <div className={styles.statTrend}>↑ 15% 较上月</div>
        </div>
        
        <div className={styles.statCard}>
          <h3>活跃用户</h3>
          <div className={styles.statNumber}>892</div>
          <div className={styles.statTrend}>↑ 5% 较上月</div>
          <Button 
            variant="secondary" 
            size="small"
            onClick={() => navigate('/analytics')}
            style={{ marginTop: '12px' }}
          >
            查看分析
          </Button>
        </div>
      </div>
      
      <div className={styles.contentSection}>
        <h3>最近活动</h3>
        <div className={styles.activityList}>
          <div className={styles.activityItem}>
            <span className={styles.activityIcon}>👤</span>
            <div className={styles.activityContent}>
              <strong>新用户注册</strong>
              <span>用户 demo 刚刚注册了账户</span>
            </div>
            <span className={styles.activityTime}>2分钟前</span>
          </div>
          <div className={styles.activityItem}>
            <span className={styles.activityIcon}>💰</span>
            <div className={styles.activityContent}>
              <strong>新订单</strong>
              <span>订单 #12345 已创建</span>
            </div>
            <span className={styles.activityTime}>5分钟前</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
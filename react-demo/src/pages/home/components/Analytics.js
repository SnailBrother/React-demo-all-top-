import React from 'react';
import { Button } from '../../../components/UI';
import styles from '../home.module.css';

const Analytics = () => {
  return (
    <div className={styles.pageContent}>
      <div className={styles.pageHeader}>
        <h2>数据分析</h2>
        <p>查看系统数据统计和分析报告</p>
      </div>
      
      <div className={styles.contentSection}>
        <h3>访问统计</h3>
        <div className={styles.chartPlaceholder}>
          <div className={styles.chart}>
            📊 访问量趋势图表
          </div>
          <div className={styles.chart}>
            📈 用户行为分析
          </div>
        </div>
      </div>
      
      <div className={styles.contentSection}>
        <h3>关键指标</h3>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3>日活跃用户</h3>
            <div className={styles.statNumber}>1,234</div>
            <div className={styles.statTrend}>↑ 5.2%</div>
          </div>
          <div className={styles.statCard}>
            <h3>页面浏览量</h3>
            <div className={styles.statNumber}>45,678</div>
            <div className={styles.statTrend}>↑ 12.8%</div>
          </div>
          <div className={styles.statCard}>
            <h3>平均停留时间</h3>
            <div className={styles.statNumber}>3:45</div>
            <div className={styles.statTrend}>↑ 0:23</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
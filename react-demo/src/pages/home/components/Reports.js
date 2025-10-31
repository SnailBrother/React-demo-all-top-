import React, { useState } from 'react';
import { Button, Input } from '../../../components/UI';
import styles from '../home.module.css';

const Reports = () => {
  const [reports] = useState([
    { id: 1, name: '用户增长报告', date: '2024-01-15', type: '月报' },
    { id: 2, name: '销售业绩报告', date: '2024-01-10', type: '周报' },
    { id: 3, name: '系统运行报告', date: '2024-01-05', type: '日报' },
  ]);

  return (
    <div className={styles.pageContent}>
      <div className={styles.pageHeader}>
        <h2>报表中心</h2>
        <p>生成和管理各类业务报表</p>
      </div>
      
      <div className={styles.toolbar}>
        <Input 
          placeholder="搜索报表..."
          className={styles.searchInput}
        />
        <Button variant="primary">生成新报表</Button>
      </div>
      
      <div className={styles.tableContainer}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>报表名称</th>
              <th>生成日期</th>
              <th>类型</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(report => (
              <tr key={report.id}>
                <td>{report.name}</td>
                <td>{report.date}</td>
                <td>
                  <span className={`${styles.reportBadge} ${
                    report.type === '月报' ? styles.monthly : 
                    report.type === '周报' ? styles.weekly : styles.daily
                  }`}>
                    {report.type}
                  </span>
                </td>
                <td>
                  <div className={styles.actionButtons}>
                    <Button variant="secondary" size="small">查看</Button>
                    <Button variant="secondary" size="small">下载</Button>
                    <Button variant="danger" size="small">删除</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;
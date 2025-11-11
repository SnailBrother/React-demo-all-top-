// src/components/modules/music/Home.js
import React from 'react';
import MusicLayout from './MusicLayout';
import styles from './Home.module.css';

const Home = () => {
    return (
        <MusicLayout>
            <div className={styles.home}>
                {/* 原有内容 */}
                <div className={styles.quickActions}>
                    <div className={styles.actionCard}>
                        <div className={styles.actionIcon}>🎵</div>
                        <div className={styles.actionText}>继续播放</div>
                    </div>
                    <div className={styles.actionCard}>
                        <div className={styles.actionIcon}>❤️</div>
                        <div className={styles.actionText}>我的喜欢</div>
                    </div>
                    <div className={styles.actionCard}>
                        <div className={styles.actionIcon}>📊</div>
                        <div className={styles.actionText}>数据统计</div>
                    </div>
                </div>

                <div className={styles.recentSection}>
                    <h2 className={styles.sectionTitle}>最近播放</h2>
                    <div className={styles.recentList}>
                        <div className={styles.recentItem}>
                            <div className={styles.itemCover}>🎵</div>
                            <div className={styles.itemInfo}>
                                <div className={styles.itemTitle}>歌曲名称</div>
                                <div className={styles.itemSubtitle}>艺术家</div>
                            </div>
                        </div>
                        <div className={styles.recentItem}>
                            <div className={styles.itemCover}>🎵</div>
                            <div className={styles.itemInfo}>
                                <div className={styles.itemTitle}>另一首歌</div>
                                <div className={styles.itemSubtitle}>另一个艺术家</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MusicLayout>
    );
};

export default Home;
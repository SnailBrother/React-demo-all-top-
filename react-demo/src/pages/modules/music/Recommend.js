// src/components/modules/music/Recommend.js  推荐界面
import React from 'react';
import styles from './Recommend.module.css';
//import MusicLayout from './MusicLayout';

const Recommend = () => {
  const recommendations = [
    {
      id: 1,
      title: '每日推荐',
      description: '根据你的喜好生成的个性化推荐',
      cover: '🎯',
      color: '#ff6b6b'
    },
    {
      id: 2,
      title: '热门榜单',
      description: '当前最受欢迎的内容',
      cover: '🔥',
      color: '#ffa726'
    },
    {
      id: 3,
      title: '新歌首发',
      description: '最新发布的音乐作品',
      cover: '🆕',
      color: '#4ecdc4'
    },
    {
      id: 4,
      title: '心情电台',
      description: '根据心情匹配的音乐',
      cover: '🎭',
      color: '#45b7d1'
    }
  ];

  return (
//  <MusicLayout>
 <div className={styles.recommend}>
      

      <div className={styles.recommendGrid}>
        {recommendations.map(item => (
          <div 
            key={item.id} 
            className={styles.recommendCard}
            style={{ '--card-color': item.color }}
          >
            <div className={styles.cardCover} style={{ backgroundColor: item.color }}>
              {item.cover}
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardDesc}>{item.description}</p>
              <button className={styles.cardButton}>查看详情</button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.trendingSection}>
        <h2 className={styles.sectionTitle}>热门推荐</h2>
        <div className={styles.trendingList}>
          {[1, 2, 3, 4, 5, 6].map(item => (
            <div key={item} className={styles.trendingItem}>
              <div className={styles.trendingCover}>🎵</div>
              <div className={styles.trendingInfo}>
                <div className={styles.trendingTitle}>热门歌曲 {item}</div>
                <div className={styles.trendingArtist}>热门艺术家</div>
                <div className={styles.trendingStats}>🔥 1.2万播放</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
//  </MusicLayout>
   

  );
};

export default Recommend;
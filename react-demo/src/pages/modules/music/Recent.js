// src/components/modules/music/Recent.js 最近播放
import React from 'react';
import styles from './Recent.module.css';
import MusicLayout from './MusicLayout';

const Recent = () => {
  const recentItems = [
    { id: 1, title: '夏天的风', artist: '周杰伦', cover: '🎵', time: '2小时前', duration: '3:45' },
    { id: 2, title: '夜曲', artist: '周杰伦', cover: '🎵', time: '5小时前', duration: '4:20' },
    { id: 3, title: '青花瓷', artist: '周杰伦', cover: '🎵', time: '昨天', duration: '3:58' },
    { id: 4, title: '简单爱', artist: '周杰伦', cover: '🎵', time: '昨天', duration: '4:30' },
    { id: 5, title: '七里香', artist: '周杰伦', cover: '🎵', time: '2天前', duration: '4:00' },
    { id: 6, title: '稻香', artist: '周杰伦', cover: '🎵', time: '3天前', duration: '3:43' },
  ];

  return (
  <MusicLayout>
 <div className={styles.recent}>
       

      <div className={styles.list}>
        {recentItems.map(item => (
          <div key={item.id} className={styles.listItem}>
            <div className={styles.itemMain}>
              <div className={styles.itemCover}>{item.cover}</div>
              <div className={styles.itemInfo}>
                <div className={styles.itemTitle}>{item.title}</div>
                <div className={styles.itemArtist}>{item.artist}</div>
              </div>
            </div>
            <div className={styles.itemMeta}>
              <span className={styles.itemTime}>{item.time}</span>
              <span className={styles.itemDuration}>{item.duration}</span>
              <button className={styles.playButton}>▶</button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>36</div>
          <div className={styles.statLabel}>本周播放</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>128</div>
          <div className={styles.statLabel}>本月播放</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>5.2h</div>
          <div className={styles.statLabel}>收听时长</div>
        </div>
      </div>
    </div>
  </MusicLayout>

   

  );
};

export default Recent;
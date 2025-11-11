// src/components/modules/music/Player.js
import React, { useEffect, useState } from 'react';
import { useMusic } from '../../../context/MusicContext';
import styles from './Player.module.css';

const Player = ({ className = '' }) => {
  const { state, dispatch } = useMusic();
  const { currentSong, isPlaying, progress } = state;
  const [hasBottomNav, setHasBottomNav] = useState(false);

  // 检测是否有底部导航
  useEffect(() => {
    const checkBottomNav = () => {
      const bottomNav = document.querySelector('[class*="bottomNav"]');
      setHasBottomNav(!!bottomNav);
    };

    checkBottomNav();
    
    // 监听DOM变化
    const observer = new MutationObserver(checkBottomNav);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
    
    return () => observer.disconnect();
  }, []);

  const togglePlay = () => {
    if (!currentSong || currentSong.title === '未播放') {
      dispatch({
        type: 'SET_CURRENT_SONG',
        payload: {
          title: '示例歌曲',
          artist: '示例艺术家',
          duration: 240,
          cover: '🎵'
        },
        index: 0
      });
    } else {
      dispatch({ type: 'TOGGLE_PLAY' });
    }
  };

  const playNext = () => {
    dispatch({ type: 'NEXT_SONG' });
  };

  const playPrev = () => {
    dispatch({ type: 'PREV_SONG' });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = currentSong && currentSong.duration > 0 
    ? (progress / currentSong.duration) * 100 
    : 0;

  return (
    <div className={`${styles.player} ${className} ${hasBottomNav ? styles.withBottomNav : ''}`}>
      {/* 进度条 - 只在有有效歌曲时显示 */}
      {(currentSong && currentSong.duration > 0) && (
        <div className={styles.progressBar}>
          <div 
            className={styles.progress} 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}

      <div className={styles.playerContent}>
        {/* 歌曲信息 */}
        <div className={styles.songInfo}>
          <div className={styles.songTitle}>
            {currentSong ? currentSong.title : '未播放'}
          </div>
          <div className={styles.songArtist}>
            {currentSong ? currentSong.artist : '选择一首歌曲开始播放'}
          </div>
        </div>

        {/* 控制按钮 */}
        <div className={styles.controls}>
          <button 
            className={styles.controlButton} 
            onClick={playPrev} 
            title="上一首"
            disabled={!currentSong || currentSong.title === '未播放'}
          >
            ⏮
          </button>
          <button 
            className={`${styles.controlButton} ${styles.playButton}`}
            onClick={togglePlay}
            title={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button 
            className={styles.controlButton} 
            onClick={playNext} 
            title="下一首"
            disabled={!currentSong || currentSong.title === '未播放'}
          >
            ⏭
          </button>
        </div>

        {/* 时间显示 - 只在有有效歌曲时显示 */}
        {(currentSong && currentSong.duration > 0) && (
          <div className={styles.extraControls}>
            <div className={styles.timeDisplay}>
              {formatTime(progress)} / {formatTime(currentSong.duration)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Player;
// src/components/modules/music/Player.js
import React, { useEffect, useRef, useState } from 'react';
import { useMusic } from '../../../context/MusicContext';
import styles from './Player.module.css';

const Player = ({ className = '' }) => {
  const { state, dispatch } = useMusic();
  const { currentSong, isPlaying, queue } = state;
  const audioRef = useRef(null);

  // **将高频状态本地化**
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // Effect to control play/pause
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(error => console.log("播放失败:", error));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Effect to handle song changes
  useEffect(() => {
    if (audioRef.current && currentSong) {
      audioRef.current.src = currentSong.src;
      // 重置本地进度
      setProgress(0); 
      setDuration(0);
      if (isPlaying) {
        audioRef.current.play().catch(error => console.log("切换播放失败:", error));
      }
    }
  }, [currentSong]);

  // --- 事件处理函数现在只更新本地 state ---
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };
  
  const handleSongEnd = () => {
    dispatch({ type: 'NEXT_SONG' });
  };

  const togglePlay = () => dispatch({ type: 'TOGGLE_PLAY' });
  const playNext = () => dispatch({ type: 'NEXT_SONG' });
  const playPrev = () => dispatch({ type: 'PREV_SONG' });

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;
  
  if (!currentSong) {
      return null;
  }

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleSongEnd}
        onError={(e) => console.error("音频错误:", e.target.error)}
      />

      <div className={`${styles.player} ${className}`}>
        <div className={styles.progressBar}><div className={styles.progress} style={{ width: `${progressPercentage}%` }} /></div>
        <div className={styles.playerContent}>
          <div className={styles.songInfo}>
            <div className={styles.songTitle}>{currentSong.title}</div>
            <div className={styles.songArtist}>{currentSong.artist}</div>
          </div>
          <div className={styles.controls}>
            <button className={styles.controlButton} onClick={playPrev} title="上一首" disabled={queue.length === 0}>⏮</button>
            <button className={`${styles.controlButton} ${styles.playButton}`} onClick={togglePlay} title={isPlaying ? '暂停' : '播放'}>
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button className={styles.controlButton} onClick={playNext} title="下一首" disabled={queue.length === 0}>⏭</button>
          </div>
          <div className={styles.extraControls}>
            <div className={styles.timeDisplay}>
              {formatTime(progress)} / {formatTime(duration)}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Player;
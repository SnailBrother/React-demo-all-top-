import React, { useEffect, useRef, useState } from 'react';
import { useMusic } from '../../../context/MusicContext';
import styles from './Player.module.css';

// 辅助函数：格式化时间
const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const Player = ({ className = '' }) => {
  const { state, dispatch } = useMusic();
  const { currentSong, isPlaying, queue, volume = 1, playMode = 'repeat' } = state; 
  const audioRef = useRef(null);

  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  // --- 核心播放逻辑 ---
  useEffect(() => {
    if (audioRef.current) {
      isPlaying ? audioRef.current.play().catch(console.error) : audioRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current && currentSong) {
      audioRef.current.src = currentSong.src;
      setProgress(0); 
      setDuration(0);
      setIsLiked(currentSong.isLiked || false);
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [currentSong]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);
  
  // --- 事件处理函数 ---
  const handleTimeUpdate = () => {
    if (audioRef.current) setProgress(audioRef.current.currentTime);
  };
  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };
  const handleSongEnd = () => dispatch({ type: 'NEXT_SONG' });

  // --- 控制函数 ---
  const togglePlay = () => dispatch({ type: 'TOGGLE_PLAY' });
  const playNext = () => dispatch({ type: 'NEXT_SONG' });
  const playPrev = () => dispatch({ type: 'PREV_SONG' });
  const togglePlayMode = () => dispatch({ type: 'TOGGLE_PLAY_MODE' });
  
  const handleProgressChange = (e) => {
    if (audioRef.current) audioRef.current.currentTime = e.target.value;
  };
  const handleVolumeChange = (e) => dispatch({ type: 'SET_VOLUME', payload: parseFloat(e.target.value) });
  const handleLike = () => setIsLiked(!isLiked);
  
  const showComments = () => alert('评论功能待开发');
  const showLyrics = () => alert('歌词功能待开发');
  const showPlaylist = () => alert('播放列表功能待开发');

  if (!currentSong) return null;

  const getPlayModeIcon = () => {
    if (playMode === 'repeat-one') return '🔂';
    if (playMode === 'shuffle') return '🔀';
    return '🔁';
  };

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleSongEnd}
        loop={playMode === 'repeat-one'}
      />

      <div className={`${styles.player} ${className}`}>
        {/* --- 第一列：歌曲封面 --- */}
        <div className={styles.column1}>
        <img 
            // 【关键修改】这里使用了 currentSong.coverimage
            src={currentSong.coverimage || 'http://121.4.22.55:80/backend/musics/default.jpg'} 
            alt={currentSong.title} 
            className={styles.playerArtwork}
            // 当图片加载失败时，也使用默认图片
            onError={(e) => { e.target.onerror = null; e.target.src='http://121.4.22.55:80/backend/musics/default.jpg' }}
          />
        </div>

        {/* --- 第二列：歌曲信息与操作 --- */}
        <div className={styles.column2}>
            <div className={styles.songDetails}>
                <span className={styles.songTitle}>{currentSong.title}</span>
                <span className={styles.songArtist}>{currentSong.artist}</span>
            </div>
            <div className={styles.songActions}>
                <button className={`${styles.actionButton} ${isLiked ? styles.liked : ''}`} onClick={handleLike} title="喜欢">
                    {isLiked ? '❤️' : '♡'}
                </button>
                <button className={styles.actionButton} onClick={showComments} title="评论">
                    💬
                </button>
            </div>
        </div>

        {/* --- 第三列：主要控件和进度条 --- */}
        <div className={styles.column3}>
          <div className={styles.topControls}>
            <button className={styles.controlButton} onClick={togglePlayMode} title={`播放模式: ${playMode}`}>{getPlayModeIcon()}</button>
            <button className={styles.controlButton} onClick={playPrev} title="上一首" disabled={queue.length === 0}>⏮</button>
            <button className={`${styles.controlButton} ${styles.playButton}`} onClick={togglePlay} title={isPlaying ? '暂停' : '播放'}>
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button className={styles.controlButton} onClick={playNext} title="下一首" disabled={queue.length === 0}>⏭</button>
          </div>
          <div className={styles.bottomControls}>
            <span className={styles.timeDisplay}>{formatTime(progress)}</span>
            <input
              type="range" min="0" max={duration || 1} value={progress}
              onChange={handleProgressChange} className={styles.progressBar}
            />
            <span className={styles.timeDisplay}>{formatTime(duration)}</span>
          </div>
        </div>

        {/* --- 第四列：附加控件 --- */}
        <div className={styles.column4}>
          <button className={styles.controlButton} onClick={showLyrics} title="歌词">詞</button>
          <div className={styles.volumeControl}>
            <span className={styles.volumeIcon}>🔊</span>
            <input
              type="range" min="0" max="1" step="0.01" value={volume}
              onChange={handleVolumeChange} className={styles.volumeSlider}
            />
          </div>
          <button className={styles.controlButton} onClick={showPlaylist} title="播放列表">☰</button>
        </div>
      </div>
    </>
  );
};

export default Player;

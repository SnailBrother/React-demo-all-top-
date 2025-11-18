import React, { useEffect, useRef, useState } from 'react';
import { useMusic } from '../../../context/MusicContext';
import { useAuth } from '../../../context/AuthContext'; // 导入 AuthContext
import axios from 'axios';
import styles from './Player.module.css';
import { useNavigate } from 'react-router-dom'; // 添加导入
import io from 'socket.io-client';

// 创建 Socket.IO 实例
const socket = io('http://121.4.22.55:5201');

// 辅助函数：格式化时间
const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// 辅助函数：生成文件名（移除特殊字符）
const generateFileName = (title, artist, extension) => {
  // 移除文件名中的非法字符
  const cleanTitle = title.replace(/[<>:"/\\|?*]/g, '');
  const cleanArtist = artist.replace(/[<>:"/\\|?*]/g, '');
  return `${cleanTitle}-${cleanArtist}.${extension}`;
};

const Player = ({ className = '' }) => {
  const navigate = useNavigate(); // 添加导航hook
  const { state, dispatch } = useMusic();
  const { user, isAuthenticated } = useAuth(); // 获取用户信息
  const { currentSong, isPlaying, queue, volume = 1, playMode = 'repeat', currentRoom, isInRoom, roomUsers, isHost } = state;
  const audioRef = useRef(null);

  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);
 

  // --- 记录播放历史 ---
  const recordPlayHistory = async (song) => {
    if (!isAuthenticated || !user?.email || !song) {
      return;
    }

    try {
      // 生成正确的文件名
      const coverimageFileName = generateFileName(song.title, song.artist, 'jpg');
      const srcFileName = generateFileName(song.title, song.artist, 'mp3');

      await axios.post('/api/reactdemoRecentlyPlayedmusic', {
        email: user.email,
        title: song.title,
        artist: song.artist,
        coverimage: coverimageFileName, // 使用生成的文件名
        src: srcFileName, // 使用生成的文件名
        genre: song.genre || ''   // 如果有歌曲类型就传，没有就传空字符串
      });
      console.log('播放记录保存成功', {
        coverimage: coverimageFileName,
        src: srcFileName
      });
    } catch (err) {
      console.error('保存播放记录失败:', err);
      // 这里可以选择不提示用户，避免影响播放体验
    }
  };

  // --- 增加播放量 ---
  // --- 增加播放量 ---
  const increasePlayCount = async (song) => {
    if (!song) {
      return;
    }

    try {
      await axios.post('/api/reactdemoIncreasePlayCount', {
        title: song.title,
        artist: song.artist
      });
      console.log('播放量统计请求已发送:', { title: song.title, artist: song.artist });
    } catch (err) {
      console.error('增加播放量失败:', err);
      // 这里可以选择不提示用户，避免影响播放体验
    }
  };

  // --- 检查歌曲是否已被收藏 ---
  useEffect(() => {
    if (currentSong && isAuthenticated && user?.username) {
      checkIfLiked();
    } else {
      setIsLiked(false);
    }
  }, [currentSong, isAuthenticated, user?.username]);

  const checkIfLiked = async () => {
    try {
      const response = await axios.get('http://121.4.22.55:5201/backend/api/reactdemofavorites', {
        params: {
          username: user.username,
          search: currentSong.title // 通过歌曲名搜索
        }
      });

      // 检查当前歌曲是否在收藏列表中
      const isSongLiked = response.data.data.some(favorite =>
        favorite.title === currentSong.title && favorite.artist === currentSong.artist
      );
      setIsLiked(isSongLiked);
    } catch (err) {
      console.error('检查收藏状态失败:', err);
    }
  };

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

      // 当歌曲切换时，记录播放历史和增加播放量
      if (isAuthenticated && user?.email) {
        recordPlayHistory(currentSong);
      }

      // 每次切换歌曲时增加播放量
      increasePlayCount(currentSong);

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
    if (audioRef.current) {
      const currentProgress = audioRef.current.currentTime;
      setProgress(currentProgress);
      // 更新到 Context，让歌词页面也能获取
      dispatch({ type: 'SET_PROGRESS', payload: currentProgress });
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const totalDuration = audioRef.current.duration;
      setDuration(totalDuration);
      // 更新到 Context
      dispatch({ type: 'SET_DURATION', payload: totalDuration });
    }
  };

  const handleSongEnd = () => {
    // 歌曲播放结束时也增加播放量（确保完整播放）
    if (currentSong && progress > duration * 0.5) { // 播放超过50%才计数
      increasePlayCount(currentSong);
    }
    dispatch({ type: 'NEXT_SONG' });
  };

  // --- 控制函数 ---
  const togglePlay = () => dispatch({ type: 'TOGGLE_PLAY' });
  const playNext = () => dispatch({ type: 'NEXT_SONG' });
  const playPrev = () => dispatch({ type: 'PREV_SONG' });
  const togglePlayMode = () => dispatch({ type: 'TOGGLE_PLAY_MODE' });

  const handleProgressChange = (e) => {
    if (audioRef.current) audioRef.current.currentTime = e.target.value;
  };
  const handleVolumeChange = (e) => dispatch({ type: 'SET_VOLUME', payload: parseFloat(e.target.value) });

  // --- 修改喜欢功能 ---
  const handleLike = async () => {
    if (!isAuthenticated || !user?.username) {
      alert('请先登录');
      return;
    }

    if (!currentSong) return;

    setLoading(true);
    try {
      if (isLiked) {
        // 取消收藏
        await axios.delete('http://121.4.22.55:5201/backend/api/favorites', {
          data: {
            user_name: user.username,  // 对应数据库的 user_name
            song_name: currentSong.title  // 对应数据库的 song_name
          }
        });
        setIsLiked(false);
        console.log('取消收藏成功');
      } else {
        // 添加收藏
        await axios.post('http://121.4.22.55:5201/backend/api/favorites', {
          user_name: user.username,    // 对应数据库的 user_name
          song_name: currentSong.title, // 对应数据库的 song_name
          artist: currentSong.artist,  // 对应数据库的 artist
          play_count: 1                // 初始播放次数
        });
        setIsLiked(true);
        console.log('添加收藏成功');
      }
    } catch (err) {
      console.error('操作收藏失败:', err);
      alert('操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

 //歌曲评论
    const showComments = () => {
    if (!currentSong) {
      alert('请先选择一首歌曲');
      return;
    }
    navigate('/app/music/musicsongreview');
  };

  // 修改 showLyrics 函数
  const showLyrics = () => {
    if (!currentSong) {
      alert('请先选择一首歌曲');
      return;
    }
    navigate('/app/music/musicplayerlyrics');
  };

  const showPlaylist = () => {
    if (!currentSong) {
      alert('请先选择一首歌曲');
      return;
    }
    navigate('/app/music/musicplaylist');
  };

  if (!currentSong) return null; // 如果没有当前歌曲，不渲染播放器

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
            src={currentSong.coverimage || 'http://121.4.22.55:80/backend/musics/default.jpg'}
            alt={currentSong.title}
            className={styles.playerArtwork}
            onError={(e) => { e.target.onerror = null; e.target.src = 'http://121.4.22.55:80/backend/musics/default.jpg' }}
          />
        </div>

        {/* --- 第二列：歌曲信息与操作 --- */}
        <div className={styles.column2}>
          <div className={styles.songDetails}>
            <span className={styles.songTitle}>{currentSong.title}</span>
            <span className={styles.songArtist}>{currentSong.artist}</span>

            {/* 一起听歌的房间 */}
            {isInRoom && currentRoom && (
              <span className={styles.roomNameLabel}>
               {currentRoom?.room_name}  {isInRoom ? '在房间' : '不在房间'}
              </span>
            )}
            
          </div>
          <div className={styles.songActions}>
            <button
              className={`${styles.actionButton} ${isLiked ? styles.liked : ''}`}
              onClick={handleLike}
              title={isLiked ? "取消喜欢" : "喜欢"}
              disabled={loading}
            >
              {loading ? '⏳' : (isLiked ? '❤️' : '♡')}
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
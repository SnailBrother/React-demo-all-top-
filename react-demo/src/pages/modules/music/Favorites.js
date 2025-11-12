// src/components/modules/music/Favorites.js 我的喜欢
import React, { useState } from 'react';
import styles from './Favorites.module.css';
 //import MusicLayout from './MusicLayout';

const Favorites = () => {
  const [activeTab, setActiveTab] = useState('songs');
  
  const favorites = {
    songs: [
      { id: 1, title: '晴天', artist: '周杰伦', cover: '🎵', liked: true },
      { id: 2, title: '夜曲', artist: '周杰伦', cover: '🎵', liked: true },
      { id: 3, title: '七里香', artist: '周杰伦', cover: '🎵', liked: true },
    ],
    albums: [
      { id: 1, title: '范特西', artist: '周杰伦', cover: '💿', year: '2001' },
      { id: 2, title: '七里香', artist: '周杰伦', cover: '💿', year: '2004' },
    ],
    artists: [
      { id: 1, name: '周杰伦', cover: '👨‍🎤', songs: 128 },
      { id: 2, name: '林俊杰', cover: '👨‍🎤', songs: 95 },
    ]
  };

  return (
  //<MusicLayout>
 <div className={styles.favorites}>
       

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'songs' ? styles.active : ''}`}
          onClick={() => setActiveTab('songs')}
        >
          歌曲 ({favorites.songs.length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'albums' ? styles.active : ''}`}
          onClick={() => setActiveTab('albums')}
        >
          专辑 ({favorites.albums.length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'artists' ? styles.active : ''}`}
          onClick={() => setActiveTab('artists')}
        >
          艺术家 ({favorites.artists.length})
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'songs' && (
          <div className={styles.songList}>
            {favorites.songs.map(song => (
              <div key={song.id} className={styles.songItem}>
                <div className={styles.songCover}>{song.cover}</div>
                <div className={styles.songInfo}>
                  <div className={styles.songTitle}>{song.title}</div>
                  <div className={styles.songArtist}>{song.artist}</div>
                </div>
                <div className={styles.songActions}>
                  <button className={styles.likeButton}>❤️</button>
                  <button className={styles.playButton}>▶</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'albums' && (
          <div className={styles.albumGrid}>
            {favorites.albums.map(album => (
              <div key={album.id} className={styles.albumCard}>
                <div className={styles.albumCover}>{album.cover}</div>
                <div className={styles.albumInfo}>
                  <div className={styles.albumTitle}>{album.title}</div>
                  <div className={styles.albumArtist}>{album.artist}</div>
                  <div className={styles.albumYear}>{album.year}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'artists' && (
          <div className={styles.artistGrid}>
            {favorites.artists.map(artist => (
              <div key={artist.id} className={styles.artistCard}>
                <div className={styles.artistAvatar}>{artist.cover}</div>
                <div className={styles.artistInfo}>
                  <div className={styles.artistName}>{artist.name}</div>
                  <div className={styles.artistSongs}>{artist.songs} 首歌曲</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
 
  // </MusicLayout>

  );
};

export default Favorites;
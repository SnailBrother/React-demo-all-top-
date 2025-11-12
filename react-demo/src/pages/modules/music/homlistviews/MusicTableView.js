// src/components/modules/music/homlistviews/MusicTableView.js
import React from 'react';
import styles from './MusicTableView.module.css';

const MusicTableView = ({ musics, onPlayMusic, onLike, lastMusicElementRef }) => {
    return (
        <div className={styles.musicTableContainer}>
            <table className={styles.musicTable}>
                <thead>
                    <tr>
                        <th className={styles.thIndex}>#</th>
                        <th className={styles.thInfo}>歌曲信息</th>
                        <th className={styles.thAction}>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {musics.map((music, index) => (
                        <tr 
                            key={music.id}
                            ref={musics.length === index + 1 ? lastMusicElementRef : null}
                            className={styles.musicRow}
                            onClick={() => onPlayMusic(music)}
                        >
                            <td className={styles.tdIndex}>
                                <div className={styles.indexContainer}>
                                    <span className={styles.indexNumber}>{index + 1}</span>
                                    <div className={styles.playIndicator}>
                                        <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M7 6v12l10-6z"></path>
                                        </svg>
                                    </div>
                                </div>
                            </td>
                            <td className={styles.tdInfo}>
                                <div className={styles.songInfo}>
                                    <div className={styles.albumCover}>
                                        <img 
                                            src={music.coverimage} 
                                            alt={music.title}
                                            onError={(e) => { 
                                                e.target.onerror = null; 
                                                e.target.src='http://121.4.22.55:80/backend/musics/default.jpg' 
                                            }}
                                        />
                                    </div>
                                    <div className={styles.songDetails}>
                                        <div className={styles.songTitle}>{music.title}</div>
                                        <div className={styles.songArtist}>{music.artist}</div>
                                    </div>
                                </div>
                            </td>
                            <td className={styles.tdAction}>
                                <button 
                                    className={styles.likeButton}
                                    onClick={(e) => onLike(e, music.id)}
                                    title="喜欢"
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                    </svg>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default MusicTableView;
// src/components/modules/music/MusicGridView.js
import React from 'react';
import styles from './MusicGridView.module.css';

const MusicGridView = ({ musics, onPlayMusic, onLike, lastMusicElementRef }) => {
    return (
        <div className={styles.musicGrid}>
            {musics.map((music, index) => (
                <div 
                    key={music.id}
                    ref={musics.length === index + 1 ? lastMusicElementRef : null}
                    className={styles.musicCard}
                    onClick={() => onPlayMusic(music)}
                >
                    <div className={styles.musicCover}>
                        <img 
                            src={music.coverimage} 
                            alt={music.title} 
                            className={styles.coverImage} 
                            loading="lazy"
                            onError={(e) => { 
                                e.target.onerror = null; 
                                e.target.src='http://121.4.22.55:80/backend/musics/default.jpg' 
                            }}
                        />
                        <div className={styles.playIconOverlay}>
                            <svg className={styles.playIcon} viewBox="0 0 24 24" fill="currentColor">
                                <path d="M7 6v12l10-6z"></path>
                            </svg>
                        </div>
                        <button 
                            className={styles.likeButton}
                            onClick={(e) => onLike(e, music.id)}
                            title="喜欢"
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                        </button>
                    </div>
                    <div className={styles.musicInfo}>
                        <div className={styles.musicTitle} title={music.title}>{music.title}</div>
                        <div className={styles.musicArtist} title={music.artist}>{music.artist}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MusicGridView;
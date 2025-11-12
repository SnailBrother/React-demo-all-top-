// src/components/modules/music/Favorites.js 我的喜欢
// src/components/modules/music/Favorites.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { useMusic } from '../../../context/MusicContext';
import styles from './Favorites.module.css';
import MusicTableView from './homlistviews/MusicTableView';
import MusicGridView from './homlistviews/MusicGridView';

const Favorites = () => {
    const { user, isAuthenticated } = useAuth();
    const { dispatch } = useMusic();
    const [favorites, setFavorites] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('table'); // 'table' 或 'grid'

    const observer = useRef();

    const lastMusicElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    useEffect(() => {
        setFavorites([]);
        setPage(1);
        setHasMore(true);
    }, [searchTerm]);

    useEffect(() => {
        if (isAuthenticated && user?.username) {
            fetchFavorites();
        }
    }, [page, searchTerm, isAuthenticated, user?.username]);

// 修改 fetchFavorites 函数中的数据处理部分
const fetchFavorites = async () => {
    setLoading(true);
    setError(null);
    try {
        const response = await axios.get('http://121.4.22.55:5201/backend/api/reactdemofavorites', {
            params: {
                username: user.username,
                page: page,
                pageSize: 20,
                search: searchTerm
            }
        });
        
        // 转换数据格式
        const newFavorites = response.data.data.map(song => ({
            id: song.id,
            title: song.title,        // 从 song_name 映射过来
            artist: song.artist,
           
            src: `http://121.4.22.55:80/backend/musics/${song.src}`,
            coverimage: song.coverimage
                        ? `http://121.4.22.55:80/backend/musics/${song.coverimage}`
                        : 'http://121.4.22.55:80/backend/musics/default.jpg',
            play_count: song.play_count
            
        }));

        console.log('收藏歌曲数据:', newFavorites); // 调试用

        setFavorites(prev => {
            const all = page === 1 ? newFavorites : [...prev, ...newFavorites];
            const unique = Array.from(new Set(all.map(m => m.id))).map(id => all.find(m => m.id === id));
            return unique;
        });
        
        setHasMore(response.data.data.length > 0 && response.data.page < response.data.totalPages);

    } catch (err) {
        console.error('获取收藏列表失败:', err);
        setError('获取收藏列表失败，请稍后重试');
    } finally {
        setLoading(false);
    }
};
    
    const handlePlayMusic = (songToPlay) => {
        const actualIndex = favorites.findIndex(music => music.id === songToPlay.id);
        
        dispatch({
            type: 'PLAY_SONG',
            payload: {
                song: songToPlay,
                queue: favorites,
                index: actualIndex,
            }
        });
    };

    const handleLike = (e, musicId) => {
        e.stopPropagation();
        console.log('取消喜欢歌曲:', musicId);
        // 这里可以添加取消喜欢歌曲的逻辑
        // 例如调用取消收藏的API，然后重新获取收藏列表
    };

    // 如果未登录，显示提示
    if (!isAuthenticated) {
        return (
            <div className={styles.home}>
                <div className={styles.allMusicSection}>
                    <div className={styles.notLoggedIn}>
                        请先登录以查看您的收藏
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.home}>
            <div className={styles.allMusicSection}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>收藏 ({favorites.length})</h2>
                    <div className={styles.controls}>
                        <div className={styles.searchContainer}>
                            <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="currentColor">
                                <path d="M10 18a7.952 7.952 0 0 0 4.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A7.952 7.952 0 0 0 18 10c0-4.411-3.589-8-8-8s-8 3.589-8 8 3.589 8 8 8zm0-14c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6 2.691-6 6-6z"></path>
                            </svg>
                            <input
                                type="text"
                                placeholder="搜索收藏的歌曲、艺术家..."
                                className={styles.searchInput}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className={styles.viewModeToggle}>
                            <button
                                className={`${styles.viewModeButton} ${viewMode === 'table' ? styles.active : ''}`}
                                onClick={() => setViewMode('table')}
                                title="列表视图"
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/>
                                </svg>
                            </button>
                            <button
                                className={`${styles.viewModeButton} ${viewMode === 'grid' ? styles.active : ''}`}
                                onClick={() => setViewMode('grid')}
                                title="网格视图"
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 3h8v8H3V3zm0 10h8v8H3v-8zm10 0h8v8h-8v-8zm0-10h8v8h-8V3z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                
                {error && <div className={styles.error}>{error}</div>}

                {viewMode === 'table' ? (
                    <MusicTableView
                        musics={favorites}
                        onPlayMusic={handlePlayMusic}
                        onLike={handleLike}
                        lastMusicElementRef={lastMusicElementRef}
                        showLikeButton={false} // 收藏页面不需要喜欢按钮
                    />
                ) : (
                    <MusicGridView
                        musics={favorites}
                        onPlayMusic={handlePlayMusic}
                        onLike={handleLike}
                        lastMusicElementRef={lastMusicElementRef}
                        showLikeButton={false} // 收藏页面不需要喜欢按钮
                    />
                )}
                
                {loading && <div className={styles.loading}>正在加载更多收藏...</div>}

                {!hasMore && favorites.length > 0 && <div className={styles.noMoreData}>已加载全部收藏</div>}
                
                {!loading && favorites.length === 0 && (
                    <div className={styles.noData}>
                        {searchTerm ? `没有找到与 "${searchTerm}" 相关的收藏` : '暂无收藏的音乐'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Favorites;
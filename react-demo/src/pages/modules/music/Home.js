// src/components/modules/music/Home.js
// src/components/modules/music/Home.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import styles from './Home.module.css';
import { useMusic } from '../../../context/MusicContext';
import MusicTableView from './homlistviews/MusicTableView';
import MusicGridView from './homlistviews/MusicGridView';
import { Loading } from '../../../components/UI';

const Home = () => {
    const { dispatch, currentSong } = useMusic();
    const [musics, setMusics] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('table');

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

    // 搜索时重置状态
    useEffect(() => {
        setMusics([]);
        setPage(1);
        setHasMore(true);
    }, [searchTerm]);

    // 获取音乐数据
    useEffect(() => {
        const fetchMusics = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get('http://121.4.22.55:5201/api/getallmusics', {
                    params: { page: page, pageSize: 20, search: searchTerm }
                });
                const newMusics = response.data.data.map(song => ({
                    id: song.id,
                    title: song.title,
                    artist: song.artist,
                    genre: song.genre,
                    liked: song.liked || false,
                    src: `http://121.4.22.55:80/backend/musics/${song.src}`,
                    coverimage: song.coverimage
                        ? `http://121.4.22.55:80/backend/musics/${song.coverimage}`
                        : 'http://121.4.22.55:80/backend/musics/default.jpg',
                }));
                setMusics(prev => {
                    const all = page === 1 ? newMusics : [...prev, ...newMusics];
                    const unique = Array.from(new Set(all.map(m => m.id))).map(id => all.find(m => m.id === id));
                    return unique;
                });
                setHasMore(response.data.data.length > 0 && response.data.page < response.data.totalPages);
            } catch (err) {
                console.error('获取音乐数据失败:', err);
                setError('获取音乐数据失败，请稍后重试');
            } finally {
                setLoading(false);
            }
        };
        fetchMusics();
    }, [page, searchTerm]);

    const handlePlayMusic = (songToPlay) => {
        const actualIndex = musics.findIndex(music => music.id === songToPlay.id);
        dispatch({
            type: 'PLAY_SONG',
            payload: { song: songToPlay, queue: musics, index: actualIndex }
        });
    };

    const handleLike = (e, musicId) => {
        e.stopPropagation();
        console.log('喜欢歌曲:', musicId);
        setMusics(prevMusics => prevMusics.map(music =>
            music.id === musicId ? { ...music, liked: !music.liked } : music
        ));
    };

    // 初始加载时显示全屏加载动画
    const isInitialLoading = loading && musics.length === 0 && page === 1;
    if (isInitialLoading) {
        return (
            <div className={styles.home}>
                <div className={styles.allMusicSection}>
                    <Loading message="音乐库加载中..." />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.home}>
            <div className={styles.allMusicSection}>
                <div className={styles.sectionHeader}>
                    {/* 1. 标题 - 固定在左侧 */}
                    <h2 className={styles.sectionTitle}>音乐 ({musics.length})</h2>

                    {/* 2. 右侧容器 - 搜索框和视图切换右对齐 */}
                    <div className={styles.sectionHeaderRight}>
                        {/* 搜索框 */}
                        <div className={styles.searchContainer}>
                            <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="currentColor">
                                <path d="M10 18a7.952 7.952 0 0 0 4.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A7.952 7.952 0 0 0 18 10c0-4.411-3.589-8-8-8s-8 3.589-8 8 3.589 8 8 8zm0-14c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6 2.691-6 6-6z"></path>
                            </svg>
                            <input
                                type="text"
                                placeholder="搜索歌曲、艺术家..."
                                className={styles.searchInput}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* 视图切换 */}
                        <div className={styles.viewModeToggle}>
                            <button
                                className={`${styles.viewModeButton} ${viewMode === 'table' ? styles.active : ''}`}
                                onClick={() => setViewMode('table')}
                                title="列表视图"
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" /></svg>
                            </button>
                            <button
                                className={`${styles.viewModeButton} ${viewMode === 'grid' ? styles.active : ''}`}
                                onClick={() => setViewMode('grid')}
                                title="网格视图"
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h8v8H3V3zm0 10h8v8H3v-8zm10 0h8v8h-8v-8zm0-10h8v8h-8V3z" /></svg>
                            </button>
                        </div>
                    </div>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                {/* 搜索或首次加载时的加载状态 */}
                {loading && musics.length === 0 && (
                    <div className={styles.loadingOverlay}>
                        <Loading message={searchTerm ? `正在搜索 "${searchTerm}"...` : "正在加载音乐..."} />
                    </div>
                )}

                {/* 内容区域 */}
                <div className={styles.contentArea}>
                    {viewMode === 'table' ? (
                        <MusicTableView
                            musics={musics}
                            onPlayMusic={handlePlayMusic}
                            onLike={handleLike}
                            lastMusicElementRef={lastMusicElementRef}
                            currentSong={currentSong}
                        />
                    ) : (
                        <MusicGridView
                            musics={musics}
                            onPlayMusic={handlePlayMusic}
                            onLike={handleLike}
                            lastMusicElementRef={lastMusicElementRef}
                            currentSong={currentSong}
                        />
                    )}
                </div>

                {/* 滚动加载时的加载提示 */}
                {loading && musics.length > 0 && (
                    <div className={styles.loadingMore}>
                        <Loading message="正在加载更多音乐..." />
                    </div>
                )}

                {!hasMore && musics.length > 0 && (
                    <div className={styles.noMoreData}>已加载全部音乐</div>
                )}

                {!loading && musics.length === 0 && (
                    <div className={styles.noData}>
                        {searchTerm ? `没有找到与 "${searchTerm}" 相关的音乐` : '曲库中暂无音乐'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
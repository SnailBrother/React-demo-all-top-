// src/components/modules/music/Recommend.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { useMusic } from '../../../context/MusicContext';
import styles from './Recommend.module.css';
import MusicTableView from './homlistviews/MusicTableView';
import MusicGridView from './homlistviews/MusicGridView';
import { Loading } from '../../../components/UI';

const Recommend = () => {
    const { user, isAuthenticated } = useAuth();
    const { dispatch, currentSong } = useMusic();
    const [musicData, setMusicData] = useState({
        ranking: [],
        chinese: [],
        western: [],
        japaneseKorean: [],
        other: []
    });
    const [activeTab, setActiveTab] = useState('ranking');

    // 【修改 1】: 将单一的 page 状态改为一个对象，为每个 tab 独立记录页数
    const [pages, setPages] = useState({
        ranking: 1,
        chinese: 1,
        western: 1,
        japaneseKorean: 1,
        other: 1
    });

    const [hasMore, setHasMore] = useState({
        ranking: true,
        chinese: true,
        western: true,
        japaneseKorean: true,
        other: true
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('table');

    const observer = useRef();

    // 【修改 2】: 更新无限滚动逻辑，使其增加对应 tab 的页数
    const lastMusicElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore[activeTab]) {
                // 当滚动到底部时，增加当前激活 tab 的页数
                setPages(prevPages => ({
                    ...prevPages,
                    [activeTab]: prevPages[activeTab] + 1
                }));
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore, activeTab]);


    // 【修改 3】: 移除切换 tab 时重置 page 的 useEffect。
    // 我们只在组件首次加载或认证状态变化时触发数据获取。
    // 新数据的获取将由 pages 状态的变化来驱动。
    useEffect(() => {
        if (isAuthenticated) {
            // 只有当一个分类的数据为空时，才主动获取数据
            if (musicData[activeTab].length === 0) {
                 fetchRecommendMusic(true); // 传入 true 表示这是该 tab 的首次加载
            }
        }
    }, [activeTab, isAuthenticated]); // 依赖项简化

    // 【修改 4】: 让 useEffect 依赖于 pages 对象的变化
    useEffect(() => {
        if (isAuthenticated) {
            fetchRecommendMusic(false); // 传入 false 表示这不是首次加载
        }
    }, [pages, searchTerm, isAuthenticated]); // 依赖项改为 pages


    // 【修改 5】: 调整 fetch 函数，使其使用 pages 对象
    const fetchRecommendMusic = async (isFirstLoadForTab) => {
        const currentPage = pages[activeTab];

        // 如果不是首次加载，并且页数仍为1，或者没有更多数据了，则不执行获取
        if (!isFirstLoadForTab && (currentPage === 1 || !hasMore[activeTab])) {
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('http://121.4.22.55:5201/backend/api/reactdemorecommend', {
                params: {
                    category: activeTab,
                    page: currentPage, // 使用当前 tab 对应的页数
                    pageSize: 20,
                    search: searchTerm
                }
            });
            
            const newMusics = response.data.data.map(song => ({
                id: song.id,
                title: song.title || '未知标题',
                artist: song.artist || '未知艺术家',
                genre: song.genre || '未知类型',
                src: song.src || `http://121.4.22.55:80/backend/musics/${song.src}`,
                coverimage: song.coverimage || 'http://121.4.22.55:80/backend/musics/default.jpg',
                playcount: song.playcount || 0,
                rank: song.rank,
                duration: song.duration || 0,
                liked: song.liked || false
            }));

            setMusicData(prev => {
                // 如果是搜索导致的重新加载（页码为1），则替换数据
                const shouldReplace = currentPage === 1;
                const existingData = shouldReplace ? [] : (prev[activeTab] || []);
                const all = [...existingData, ...newMusics];
                // 去重逻辑
                const unique = Array.from(new Set(all.map(m => m.id))).map(id => all.find(m => m.id === id));
                return { ...prev, [activeTab]: unique };
            });
            
            setHasMore(prev => ({
                ...prev,
                [activeTab]: response.data.data.length > 0 && response.data.page < response.data.totalPages
            }));

        } catch (err) {
            console.error('获取推荐音乐失败:', err);
            setError('获取推荐音乐失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };
    
    // 【修改 6】: 更新搜索逻辑，使其重置所有 tab 的分页
    useEffect(() => {
        // 当搜索词变化时，重置所有分页状态到1，并清空当前音乐数据以便重新加载
        const handler = setTimeout(() => {
            setPages({ ranking: 1, chinese: 1, western: 1, japaneseKorean: 1, other: 1 });
            setMusicData({ ranking: [], chinese: [], western: [], japaneseKorean: [], other: [] });
        }, 500); // 防抖
        
        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]);


    const handlePlayMusic = (songToPlay) => {
        const currentMusics = musicData[activeTab] || [];
        const actualIndex = currentMusics.findIndex(music => music.id === songToPlay.id);
        
        if (actualIndex === -1) {
            console.error('未找到歌曲在列表中的位置');
            return;
        }

        const songWithFullData = {
            id: songToPlay.id,
            title: songToPlay.title || '未知标题',
            artist: songToPlay.artist || '未知艺术家',
            genre: songToPlay.genre || '未知类型',
            src: songToPlay.src,
            coverimage: songToPlay.coverimage || 'http://121.4.22.55:80/backend/musics/default.jpg',
            playcount: songToPlay.playcount || 0
        };

        dispatch({
            type: 'PLAY_SONG',
            payload: {
                song: songWithFullData,
                queue: currentMusics.map(song => ({
                    id: song.id,
                    title: song.title || '未知标题',
                    artist: song.artist || '未知艺术家',
                    genre: song.genre || '未知类型',
                    src: song.src,
                    coverimage: song.coverimage || 'http://121.4.22.55:80/backend/musics/default.jpg'
                })),
                index: actualIndex,
            }
        });
    };

    const handlePlaySingle = (songToPlay) => {
        const songWithFullData = {
            id: songToPlay.id,
            title: songToPlay.title || '未知标题',
            artist: songToPlay.artist || '未知艺术家',
            genre: songToPlay.genre || '未知类型',
            src: songToPlay.src,
            coverimage: songToPlay.coverimage || 'http://121.4.22.55:80/backend/musics/default.jpg'
        };

        dispatch({
            type: 'PLAY_SONG',
            payload: {
                song: songWithFullData,
                queue: [songWithFullData],
                index: 0,
            }
        });
    };

    const handleLike = async (e, musicId) => {
        e.stopPropagation();
        try {
            await axios.post('http://121.4.22.55:5201/backend/api/favorites', {
                username: user.username,
                musicId: musicId
            });
            
            setMusicData(prev => {
                const updatedData = { ...prev };
                Object.keys(updatedData).forEach(category => {
                    updatedData[category] = updatedData[category].map(music => 
                        music.id === musicId ? { ...music, liked: true } : music
                    );
                });
                return updatedData;
            });
            
        } catch (err) {
            console.error('喜欢歌曲失败:', err);
            setError('喜欢歌曲失败，请稍后重试');
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const getTabName = (tabKey) => {
        const tabNames = {
            ranking: '排行榜',
            chinese: '华语',
            western: '欧美',
            japaneseKorean: '日韩',
            other: '其他'
        };
        return tabNames[tabKey] || tabKey;
    };

    const currentMusics = musicData[activeTab] || [];
    const currentHasMore = hasMore[activeTab];

    // 初始加载时显示全屏加载动画 (现在只在 musicData 完全为空时显示)
    const isInitialLoading = loading && Object.values(musicData).every(arr => arr.length === 0);
    if (isInitialLoading) {
        return <Loading message="音乐推荐加载中..." />;
    }

    return (
        <div className={styles.home}>
            <div className={styles.allMusicSection}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>音乐推荐</h2>
                    <div className={styles.controls}>
                        <div className={styles.searchContainer}>
                            <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="currentColor">
                                <path d="M10 18a7.952 7.952 0 0 0 4.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A7.952 7.952 0 0 0 18 10c0-4.411-3.589-8-8-8s-8 3.589-8 8 3.589 8 8 8zm0-14c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6 2.691-6 6-6z"></path>
                            </svg>
                            <input
                                type="text"
                                placeholder="搜索推荐歌曲、艺术家..."
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

                <div className={styles.tabContainer}>
                    {['ranking', 'chinese', 'western', 'japaneseKorean', 'other'].map(tab => (
                        <button
                            key={tab}
                            className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
                            onClick={() => handleTabChange(tab)}
                        >
                            {getTabName(tab)}
                        </button>
                    ))}
                </div>
                
                {error && <div className={styles.error}>{error}</div>}

                {/* 切换tab时的加载状态 - 只在数据为空且正在加载时显示 */}
                {loading && currentMusics.length === 0 && (
                    <div className={styles.loadingOverlay}>
                        <Loading message={`正在加载${getTabName(activeTab)}音乐...`} />
                    </div>
                )}

                {/* 内容区域 */}
                <div className={styles.contentArea}>
                    {viewMode === 'table' ? (
                        <MusicTableView
                            musics={currentMusics}
                            onPlayMusic={handlePlayMusic}
                            onPlaySingle={handlePlaySingle}
                            onLike={handleLike}
                            lastMusicElementRef={lastMusicElementRef}
                            showLikeButton={true}
                            showRank={activeTab === 'ranking'}
                            currentSong={currentSong}
                        />
                    ) : (
                        <MusicGridView
                            musics={currentMusics}
                            onPlayMusic={handlePlayMusic}
                            onPlaySingle={handlePlaySingle}
                            onLike={handleLike}
                            lastMusicElementRef={lastMusicElementRef}
                            showLikeButton={true}
                            showRank={activeTab === 'ranking'}
                            currentSong={currentSong}
                        />
                    )}
                </div>
                
                {/* 滚动加载时的加载提示 */}
                {loading && currentMusics.length > 0 && (
                    <div className={styles.loadingMore}>
                        <Loading message={`正在加载更多${getTabName(activeTab)}音乐...`} />
                    </div>
                )}

                {!currentHasMore && currentMusics.length > 0 && (
                    <div className={styles.noMoreData}>已加载全部{getTabName(activeTab)}音乐</div>
                )}
                
                {!loading && currentMusics.length === 0 && (
                    <div className={styles.noData}>
                        {searchTerm ? `没有找到与 "${searchTerm}" 相关的${getTabName(activeTab)}音乐` : `暂无${getTabName(activeTab)}音乐推荐`}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Recommend;
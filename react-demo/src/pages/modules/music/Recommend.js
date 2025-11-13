// src/components/modules/music/Recommend.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { useMusic } from '../../../context/MusicContext';
import styles from './Recommend.module.css';
import MusicTableView from './homlistviews/MusicTableView';
import MusicGridView from './homlistviews/MusicGridView';

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
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState({
        ranking: true,
        chinese: true,
        western: true,
        japaneseKorean: true,
        other: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('table');

    const observer = useRef();

    const lastMusicElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore[activeTab]) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore, activeTab]);

    // 只在搜索词变化时重置数据
    useEffect(() => {
        if (searchTerm) {
            // 搜索时重置当前tab的数据
            setMusicData(prev => ({
                ...prev,
                [activeTab]: []
            }));
            setPage(1);
            setHasMore(prev => ({
                ...prev,
                [activeTab]: true
            }));
        }
    }, [searchTerm]); // 移除 activeTab 依赖

    // 切换tab时重置分页，但不重置数据
    useEffect(() => {
        setPage(1);
        // 如果当前tab没有数据，设置可以加载更多
        if (musicData[activeTab].length === 0) {
            setHasMore(prev => ({
                ...prev,
                [activeTab]: true
            }));
        }
    }, [activeTab]); // 只在tab切换时执行

    useEffect(() => {
        if (isAuthenticated) {
            fetchRecommendMusic();
        }
    }, [page, searchTerm, activeTab, isAuthenticated]);

    const fetchRecommendMusic = async () => {
        // 如果当前tab没有更多数据，就不请求
        if (!hasMore[activeTab] && page > 1) {
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('http://121.4.22.55:5201/backend/api/reactdemorecommend', {
                params: {
                    category: activeTab,
                    page: page,
                    pageSize: 20,
                    search: searchTerm
                }
            });
            
            // 转换数据格式 - 确保字段与 MusicContext 匹配
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

            console.log('推荐音乐数据:', newMusics);

            setMusicData(prev => {
                const all = page === 1 ? newMusics : [...prev[activeTab], ...newMusics];
                const unique = Array.from(new Set(all.map(m => m.id))).map(id => all.find(m => m.id === id));
                return {
                    ...prev,
                    [activeTab]: unique
                };
            });
            
            // 更新当前tab的hasMore状态
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

    const handlePlayMusic = (songToPlay) => {
        console.log('播放歌曲:', songToPlay);
        
        const currentMusics = musicData[activeTab] || [];
        const actualIndex = currentMusics.findIndex(music => music.id === songToPlay.id);
        
        console.log('当前歌曲列表:', currentMusics);
        console.log('找到的索引:', actualIndex);
        
        if (actualIndex === -1) {
            console.error('未找到歌曲在列表中的位置');
            return;
        }

        // 确保歌曲数据完整
        const songWithFullData = {
            id: songToPlay.id,
            title: songToPlay.title || '未知标题',
            artist: songToPlay.artist || '未知艺术家',
            genre: songToPlay.genre || '未知类型',
            src: songToPlay.src,
            coverimage: songToPlay.coverimage || 'http://121.4.22.55:80/backend/musics/default.jpg',
            playcount: songToPlay.playcount || 0
        };

        console.log('最终播放的歌曲数据:', songWithFullData);

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
        console.log('播放单曲:', songToPlay);
        
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
        console.log('喜欢歌曲:', musicId);
        
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
        // 切换tab时不需要重置数据，只需要重置分页
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

    if (!isAuthenticated) {
        return (
            <div className={styles.home}>
                <div className={styles.allMusicSection}>
                    <div className={styles.notLoggedIn}>
                        请先登录以查看音乐推荐
                    </div>
                </div>
            </div>
        );
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
                            {musicData[tab] && musicData[tab].length > 0 && (
                                <span className={styles.tabCount}>{musicData[tab].length}</span>
                            )}
                        </button>
                    ))}
                </div>
                
                {error && <div className={styles.error}>{error}</div>}

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
                
                {loading && <div className={styles.loading}>正在加载更多{getTabName(activeTab)}音乐...</div>}

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
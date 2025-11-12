// src/components/modules/music/Home.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
//import MusicLayout from './MusicLayout';
import styles from './Home.module.css';
import { useMusic } from '../../../context/MusicContext'; // 导入 useMusic Hook

const Home = () => {
    const { dispatch } = useMusic(); // 从 Context 获取 dispatch 函数
    const [musics, setMusics] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // --- Intersection Observer 的设置，用于无限滚动 ---
    const observer = useRef();
    const lastMusicElementRef = useCallback(node => {
        if (loading) return; // 如果正在加载，则不处理
        if (observer.current) observer.current.disconnect(); // 断开之前的观察器
        observer.current = new IntersectionObserver(entries => {
            // 如果最后一个元素可见，并且还有更多数据，则加载下一页
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node); // 观察新的最后一个元素
    }, [loading, hasMore]);

    // 当搜索词变化时，重置数据列表和分页状态
    useEffect(() => {
        setMusics([]); // 清空现有音乐
        setPage(1);    // 页码重置为1
        setHasMore(true); // 重新允许加载
    }, [searchTerm]);

    // 当页码或搜索词变化时，获取数据
    useEffect(() => {
        // 定义在useEffect内部以捕获正确的page和searchTerm
        const fetchMusics = async () => {
            setLoading(true);
            setError(null);
            try {
                // 注意：您之前的代码里，URL是 getallmusics，这里保持一致
                const response = await axios.get('http://121.4.22.55:5201/api/getallmusics', {
                    params: { 
                        page: page, 
                        pageSize: 20, // 每次请求20条
                        search: searchTerm 
                    }
                });
                
                const newMusics = response.data.data.map(song => ({
                    id: song.id,
                    title: song.title,
                    artist: song.artist,
                    genre: song.genre,
                    src: `http://121.4.22.55:80/backend/musics/${song.src}`,
                    coverimage: song.coverimage
                        ? `http://121.4.22.55:80/backend/musics/${song.coverimage}`
                        : 'http://121.4.22.55:80/backend/musics/default.jpg',
                }));

                // 将新数据追加到现有列表，并去重
                setMusics(prev => {
                    const all = page === 1 ? newMusics : [...prev, ...newMusics];
                    const unique = Array.from(new Set(all.map(m => m.id))).map(id => all.find(m => m.id === id));
                    return unique;
                });
                
                // 更新是否还有更多数据的状态
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
    
    // **当用户点击歌曲卡片时调用的函数**
    const handlePlayMusic = (songToPlay, indexInFullList) => {
        // 找到点击的歌曲在当前完整列表中的实际索引
        const actualIndex = musics.findIndex(music => music.id === songToPlay.id);
        
        dispatch({
            type: 'PLAY_SONG',
            payload: {
                song: songToPlay,
                queue: musics, // 将当前已加载的完整列表设置为播放队列
                index: actualIndex,
            }
        });
    };

    return (
   //     <MusicLayout>
            <div className={styles.home}>
                <div className={styles.allMusicSection}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>所有音乐 ({musics.length})</h2>
                        <div className={styles.searchContainer}>
                             <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="currentColor"><path d="M10 18a7.952 7.952 0 0 0 4.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A7.952 7.952 0 0 0 18 10c0-4.411-3.589-8-8-8s-8 3.589-8 8 3.589 8 8 8zm0-14c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6 2.691-6 6-6z"></path></svg>
                            <input
                                type="text"
                                placeholder="搜索歌曲、艺术家..."
                                className={styles.searchInput}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    {error && <div className={styles.error}>{error}</div>}

                    <div className={styles.musicGrid}>
                        {musics.map((music, index) => (
                            <div 
                                // **添加 onClick 事件，调用 handlePlayMusic**
                                onClick={() => handlePlayMusic(music, index)}
                                // 将 ref 附加到最后一个元素上
                                ref={musics.length === index + 1 ? lastMusicElementRef : null} 
                                key={music.id} 
                                className={styles.musicCard}
                            >
                                <div className={styles.musicCover}>
                                    <img 
                                        src={music.coverimage} 
                                        alt={music.title} 
                                        className={styles.coverImage} 
                                        loading="lazy" // 图片懒加载，提升性能
                                        onError={(e) => { e.target.onerror = null; e.target.src='http://121.4.22.55:80/backend/musics/default.jpg' }}
                                    />
                                    <div className={styles.playIconOverlay}>
                                        <svg className={styles.playIcon} viewBox="0 0 24 24" fill="currentColor"><path d="M7 6v12l10-6z"></path></svg>
                                    </div>
                                </div>
                                <div className={styles.musicInfo}>
                                    <div className={styles.musicTitle} title={music.title}>{music.title}</div>
                                    <div className={styles.musicArtist} title={music.artist}>{music.artist}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* 加载和无数据显示 */}
                    {loading && <div className={styles.loading}>正在加载更多音乐...</div>}

                    {!hasMore && musics.length > 0 && <div className={styles.noMoreData}>已加载全部音乐</div>}
                    
                    {/* 初始加载时，musics.length 为 0 但 loading 为 true，不显示此消息 */}
                    {!loading && musics.length === 0 && (
                        <div className={styles.noData}>
                            {searchTerm ? `没有找到与 "${searchTerm}" 相关的音乐` : '曲库中暂无音乐'}
                        </div>
                    )}
                </div>
            </div>
     //   </MusicLayout>
    );
};

export default Home;
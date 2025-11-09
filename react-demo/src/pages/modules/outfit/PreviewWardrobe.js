import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import './PreviewWardrobe.css';

const PreviewWardrobe = () => {
    const { user, isAuthenticated } = useAuth();
    const [wardrobeItems, setWardrobeItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedSeason, setSelectedSeason] = useState('全部');
    const [selectedCategory, setSelectedCategory] = useState('全部');
    const [selectedSubCategory, setSelectedSubCategory] = useState('全部');
    const [showImageModal, setShowImageModal] = useState(false);
    const [modalImage, setModalImage] = useState('');
    const [showFilters, setShowFilters] = useState(false); // 移动端筛选按钮

    const seasons = ['全部', '夏季', '冬季', '四季'];
    const categories = ['全部', '衣服', '裤子', '连衣裙', '鞋子', '配饰'];
    const subCategories = {
        '全部': ['全部'],
        '衣服': ['全部', '基础款', '外套类', '毛衣', '衬衫', 'T恤', '其他'],
        '裤子': ['全部', '基础款', '长裤', '短裤', '牛仔裤', '休闲裤', '其他'],
        '连衣裙': ['全部', '基础款', '短裙', '长裙', '礼服', '日常裙', '其他'],
        '鞋子': ['全部', '基础款', '运动鞋', '皮鞋', '凉鞋', '靴子', '其他'],
        '配饰': ['全部', '基础款', '帽子', '围巾', '手套', '腰带', '其他']
    };

    useEffect(() => {
        if (isAuthenticated && user) {
            fetchWardrobeItems();
        }
    }, [isAuthenticated, user]);

    const fetchWardrobeItems = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`http://121.4.22.55:5201/api/Reactwardrobe/items?username=${user.username}`);
            setWardrobeItems(response.data.items || []);
            setError('');
        } catch (error) {
            console.error('获取衣柜数据失败:', error);
            setError('获取衣柜数据失败，请重试');
            setWardrobeItems([]);
        } finally {
            setLoading(false);
        }
    };

    const getImageUrl = (item, isEffect = false) => {
        const baseUrl = 'http://121.4.22.55:5201/images/ReactWardrobeStewar';
        const suffix = isEffect ? 'effect' : '';
        const pngUrl = `${baseUrl}/${item.username}/${item.category}/${item.item_code}${suffix}.png`;
        const jpgUrl = `${baseUrl}/${item.username}/${item.category}/${item.item_code}${suffix}.jpg`;
        
        return { pngUrl, jpgUrl };
    };

    const openImageModal = (imageUrl) => {
        setModalImage(imageUrl);
        setShowImageModal(true);
    };

    const handleSeasonChange = (season) => {
        setSelectedSeason(season);
    };

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        setSelectedSubCategory('全部');
    };

    const handleSubCategoryChange = (subCategory) => {
        setSelectedSubCategory(subCategory);
    };

    // 过滤物品
    const filteredItems = wardrobeItems.filter(item => {
        const seasonMatch = selectedSeason === '全部' || item.season === selectedSeason;
        const categoryMatch = selectedCategory === '全部' || item.category === selectedCategory;
        const subCategoryMatch = selectedSubCategory === '全部' || item.sub_category === selectedSubCategory;
        
        return seasonMatch && categoryMatch && subCategoryMatch;
    });

    // 如果用户未认证
    if (!isAuthenticated) {
        return (
            <div className="previewwardrobe-container">
                <h2 className="previewwardrobe-title">我的衣柜</h2>
                <div className="previewwardrobe-alert previewwardrobe-alert-error">
                    请先登录后再查看衣柜
                </div>
            </div>
        );
    }

    return (
        <div className="previewwardrobe-container">
            {/* 顶部标题和统计 */}
            <div className="previewwardrobe-header">
                <div className="previewwardrobe-header-main">
                    {/* <h2 className="previewwardrobe-title">我的衣柜</h2> */}
                    <div className="previewwardrobe-stats">
                        <span className="previewwardrobe-total">共 {wardrobeItems.length} 件</span>
                        <span className="previewwardrobe-filtered">筛选: {filteredItems.length} 件</span>
                    </div>
                </div>
                
                {/* 移动端筛选按钮 */}
                <button 
                    className="previewwardrobe-mobile-filter-btn"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    🔍 筛选
                </button>
            </div>

            {/* 紧凑型筛选器 */}
            <div className={`previewwardrobe-filters ${showFilters ? 'previewwardrobe-filters-show' : ''}`}>
                <div className="previewwardrobe-filter-row">
                    <div className="previewwardrobe-filter-item">
                        <label className="previewwardrobe-filter-label">季节:</label>
                        <select 
                            value={selectedSeason} 
                            onChange={(e) => handleSeasonChange(e.target.value)}
                            className="previewwardrobe-filter-select"
                        >
                            {seasons.map(season => (
                                <option key={season} value={season}>{season}</option>
                            ))}
                        </select>
                    </div>

                    <div className="previewwardrobe-filter-item">
                        <label className="previewwardrobe-filter-label">类别:</label>
                        <select 
                            value={selectedCategory} 
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            className="previewwardrobe-filter-select"
                        >
                            {categories.map(category => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                    </div>

                    {selectedCategory !== '全部' && (
                        <div className="previewwardrobe-filter-item">
                            <label className="previewwardrobe-filter-label">子类:</label>
                            <select 
                                value={selectedSubCategory} 
                                onChange={(e) => handleSubCategoryChange(e.target.value)}
                                className="previewwardrobe-filter-select"
                            >
                                {subCategories[selectedCategory].map(subCategory => (
                                    <option key={subCategory} value={subCategory}>{subCategory}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* 错误信息 */}
            {error && (
                <div className="previewwardrobe-alert previewwardrobe-alert-error">
                    {error}
                </div>
            )}

            {/* 加载状态 */}
            {loading && (
                <div className="previewwardrobe-loading">
                    <div className="previewwardrobe-loading-spinner"></div>
                    加载中...
                </div>
            )}

            {/* 衣柜物品网格 */}
            {!loading && filteredItems.length === 0 && (
                <div className="previewwardrobe-empty">
                    {wardrobeItems.length === 0 ? '您的衣柜还是空的，快去添加一些衣物吧！' : '没有找到符合条件的衣物'}
                </div>
            )}

 

{!loading && filteredItems.length > 0 && (
    <div className="previewwardrobe-grid">
        {filteredItems.map(item => {
            const itemImage = getImageUrl(item, false);
            const effectImage = getImageUrl(item, true);
            
            return (
                <div key={item.item_code} className="previewwardrobe-card">
                    {/* 图片区域 - 改为淘宝式方块布局 */}
                    <div className="previewwardrobe-card-image-container">
                        {/* 主商品图 */}
                        <div className="previewwardrobe-image-wrapper">
                            <img 
                                src={itemImage.pngUrl}
                                alt={item.item_name}
                                className="previewwardrobe-card-image"
                                onError={(e) => {
                                    if (e.target.src !== itemImage.jpgUrl) {
                                        e.target.src = itemImage.jpgUrl;
                                    }
                                }}
                                onClick={() => openImageModal(itemImage.pngUrl)}
                            />
                            <div className="previewwardrobe-image-tag">商品图</div>
                        </div>
                        
                        {/* 上身效果图 - 如果有的话 */}
                        <div className="previewwardrobe-image-wrapper">
                            <img 
                                src={effectImage.pngUrl}
                                alt={`${item.item_name}上身效果`}
                                className="previewwardrobe-card-image"
                                onError={(e) => {
                                    if (e.target.src !== effectImage.jpgUrl) {
                                        e.target.src = effectImage.jpgUrl;
                                    }
                                }}
                                onClick={() => openImageModal(effectImage.pngUrl)}
                            />
                            <div className="previewwardrobe-image-tag">上身效果</div>
                        </div>
                    </div>

                    {/* 商品信息 */}
                    <div className="previewwardrobe-card-info">
                        <h3 className="previewwardrobe-card-title">{item.item_name}</h3>
                        <div className="previewwardrobe-card-meta">
                            <span className="previewwardrobe-card-season">{item.season}</span>
                            <span className="previewwardrobe-card-category">{item.category}</span>
                            <span className="previewwardrobe-card-subcategory">{item.sub_category}</span>
                        </div>
                        <div className="previewwardrobe-card-footer">
                            <span className="previewwardrobe-card-date">
                                {new Date(item.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
            );
        })}
    </div>
)}

 

            {/* 图片预览模态框 */}
            {showImageModal && (
                <div className="previewwardrobe-modal" onClick={() => setShowImageModal(false)}>
                    <div className="previewwardrobe-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button 
                            className="previewwardrobe-modal-close"
                            onClick={() => setShowImageModal(false)}
                        >
                            ×
                        </button>
                        <img 
                            src={modalImage}
                            alt="预览"
                            className="previewwardrobe-modal-image"
                            onError={(e) => {
                                e.target.src = modalImage.replace('.png', '.jpg');
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default PreviewWardrobe;
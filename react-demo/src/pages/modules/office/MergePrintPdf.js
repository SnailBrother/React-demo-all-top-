// src/components/MergePrintPdf.js
import React, { useState, useEffect } from 'react';
import styles from './MergePrintPdf.module.css';
import io from 'socket.io-client';
// 创建全局 socket 实例（或放在 context 中更好，这里简化）
const socket = io('http://121.4.22.55:5202'); // 👈 你的后端地址

const categories = [
    {
        name: '房地产',
        files: ['公司营业执照.pdf', '房地产评估资质.pdf', '房地产估价师A.pdf', '房地产估价师B.pdf'],
    },
    {
        name: '资产',
        files: ['公司营业执照.pdf', '资产评估资质.pdf', '资产估价师C.pdf', '资产估价师D.pdf'],
    },
    {
        name: '土地',
        files: ['公司营业执照.pdf', '土地评估资质.pdf', '土地估价师E.pdf', '土地估价师F.pdf'],
    },
];

const MergePrintPdf = () => {
    const [selectedFiles, setSelectedFiles] = useState([]); // [{ category, filename }]
    const [mergedPdfUrl, setMergedPdfUrl] = useState(null);
    const [isMerging, setIsMerging] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState({});
    const [currentFilename, setCurrentFilename] = useState(null); // 存完整文件名，如 merged_12345.pdf
    const toggleCategory = (categoryName) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryName]: !prev[categoryName]
        }));
    };

    const toggleFile = (category, filename) => {
        const key = `${category}/${filename}`;
        const exists = selectedFiles.some((item) => `${item.category}/${item.filename}` === key);
        if (exists) {
            setSelectedFiles(selectedFiles.filter((item) => `${item.category}/${item.filename}` !== key));
        } else {
            setSelectedFiles([...selectedFiles, { category, filename }]);
        }
        // 清除之前的合并结果
        setMergedPdfUrl(null);
    };

    const moveUp = (index) => {
        if (index <= 0) return;
        const newSelected = [...selectedFiles];
        [newSelected[index - 1], newSelected[index]] = [newSelected[index], newSelected[index - 1]];
        setSelectedFiles(newSelected);
        setMergedPdfUrl(null);
    };

    const moveDown = (index) => {
        if (index >= selectedFiles.length - 1) return;
        const newSelected = [...selectedFiles];
        [newSelected[index], newSelected[index + 1]] = [newSelected[index + 1], newSelected[index]];
        setSelectedFiles(newSelected);
        setMergedPdfUrl(null);
    };

    const removeFile = (index) => {
        const newSelected = [...selectedFiles];
        newSelected.splice(index, 1);
        setSelectedFiles(newSelected);
        setMergedPdfUrl(null);
    };

    // 👇 核心：调用后端合并接口
    const handleMergePreview = async () => {
        if (selectedFiles.length === 0) return;
        setIsMerging(true);
        try {
            const response = await fetch('/api/mergePdfs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    files: selectedFiles,
                    oldFilename: currentFilename, // 👈 关键：传旧文件名
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setMergedPdfUrl(data.url);
                setCurrentFilename(data.filename); // 更新为新 filename

                // 通知后端：我在用这个新文件
                socket.emit('useFile', { filename: data.filename });
            } else {
                alert('合并失败');
            }
        } catch (err) {
            console.error(err);
            alert('网络错误');
        } finally {
            setIsMerging(false);
        }
    };

    // 页面卸载时释放
    useEffect(() => {
        const onBeforeUnload = () => {
            if (currentFilename) {
                socket.emit('releaseFile', { filename: currentFilename });
            }
        };
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', onBeforeUnload);
            if (currentFilename) {
                socket.emit('releaseFile', { filename: currentFilename });
            }
            // 不 close socket，因为可能多个组件共用
        };
    }, [currentFilename]);


    return (
        <div className={styles.container}>
            {/* 左侧：分类选择 */}
            <div className={styles.sidebar}>
                <h2>PDF 文件库</h2>
                {categories.map((category) => (
                    <div key={category.name} className={styles.category}>
                        <div
                            className={styles.categoryHeader}
                            onClick={() => toggleCategory(category.name)}
                        >
                            <h3>{category.name}</h3>
                            <button className={styles.toggleBtn}>
                                {expandedCategories[category.name] ? '−' : '+'}
                            </button>
                        </div>
                        <ul className={`${styles.categoryList} ${expandedCategories[category.name] ? styles.expanded : ''}`}>
                            {category.files.map((file) => {
                                const key = `${category.name}/${file}`;
                                const isChecked = selectedFiles.some(
                                    (item) => `${item.category}/${item.filename}` === key
                                );
                                return (
                                    <li key={key} className={styles.categoryItem}>
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => toggleFile(category.name, file)}
                                            />
                                            {file}
                                        </label>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </div>

            {/* 右侧 */}
            <div className={styles.main}>
                <div className={styles.rightSection}>
                    {/* 已选文件区域 */}
                    <div className={styles.selectedSection}>
                        <h2>合并预览 ({selectedFiles.length} 个文件)</h2>

                        {selectedFiles.length === 0 ? (
                            <p className={styles.empty}>请从左侧选择 PDF 文件</p>
                        ) : (
                            <ul className={styles.selectedList}>
                                {selectedFiles.map((item, index) => (
                                    <li key={`${item.category}-${item.filename}-${index}`} className={styles.selectedItem}>
                                        <span className={styles.fileName}>
                                            <span className={styles.categoryBadge}>{item.category}</span>
                                            {item.filename}
                                        </span>
                                        <div className={styles.actions}>
                                            <button onClick={() => moveUp(index)} disabled={index === 0} title="上移">↑</button>
                                            <button onClick={() => moveDown(index)} disabled={index === selectedFiles.length - 1} title="下移">↓</button>
                                            <button onClick={() => removeFile(index)} title="移除" className={styles.removeBtn}>×</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {/* 操作按钮 */}
                        <div className={styles.mergeActions}>
                            <button
                                onClick={handleMergePreview}
                                disabled={isMerging || selectedFiles.length === 0}
                                className={styles.mergeBtn}
                            >
                                {isMerging ? '合并中...' : '生成合并预览'}
                            </button>
                        </div>
                    </div>



                    {/* 合并后的 PDF 预览 */}
                    {mergedPdfUrl && (
                        <div className={styles.mergedPreview}>
                            <h3>合并后的 PDF</h3>
                            <iframe
                                src={mergedPdfUrl}
                                title="Merged PDF"
                                className={styles.mergedPdfFrame}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MergePrintPdf;
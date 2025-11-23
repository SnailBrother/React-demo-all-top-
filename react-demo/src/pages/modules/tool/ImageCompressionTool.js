import React, { useState, useEffect } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import "./ImageCompressionTool.css";

const ImageCompressionTool = () => {
    const [files, setFiles] = useState([]);
    const [compressedFiles, setCompressedFiles] = useState([]);
    const [message, setMessage] = useState("");
    const [compressionQuality, setCompressionQuality] = useState(80);
    const [scalePercentage, setScalePercentage] = useState(50);
    const [previewImage, setPreviewImage] = useState(null);
    const [originalSize, setOriginalSize] = useState(0);
    const [showUploadArea, setShowUploadArea] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    // Check if mobile on component mount and resize
    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        checkIfMobile();
        window.addEventListener('resize', checkIfMobile);
        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length > 30) {
            setMessage("一次最多只能上传 30 张图片");
            return;
        }
        setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
        setMessage("");
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files);
        if (droppedFiles.length > 30) {
            setMessage("一次最多只能上传 30 张图片");
            return;
        }
        setFiles((prevFiles) => [...prevFiles, ...droppedFiles]);
        setMessage("");
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleQualityChange = (e) => {
        setCompressionQuality(parseInt(e.target.value, 10));
    };

    const handleScaleChange = (e) => {
        setScalePercentage(parseInt(e.target.value, 10));
    };

    const compressImage = (file, scalePercentage, targetSizeKB) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);

            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                const scaleFactor = scalePercentage / 100;
                const targetWidth = Math.floor(img.width * scaleFactor);
                const targetHeight = Math.floor(img.height * scaleFactor);

                canvas.width = targetWidth;
                canvas.height = targetHeight;

                ctx.imageSmoothingQuality = "high";
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

                const targetSizeBytes = targetSizeKB * 1024;
                let quality = compressionQuality / 100;
                let compressedBlob = null;

                const compress = () => {
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                reject(new Error("无法生成压缩图片"));
                                return;
                            }

                            if (blob.size <= targetSizeBytes || quality <= 0.1) {
                                resolve({
                                    blob,
                                    width: targetWidth,
                                    height: targetHeight,
                                });
                            } else {
                                quality -= 0.05;
                                canvas.toBlob(compress, "image/jpeg", quality);
                            }
                        },
                        "image/jpeg",
                        quality
                    );
                };

                compress();
            };

            img.onerror = (error) => {
                reject(error);
            };
        });
    };

    const handleCompress = async () => {
        if (files.length === 0) {
            setMessage("请先选择图片");
            return;
        }
    
        setMessage("正在压缩图片...");
        setShowUploadArea(false);
    
        try {
            const newCompressedResults = [];
            for (const file of files) {
                if (file.type === "image/jpeg" || file.type === "image/jpg") {
                    if (file.size > 100 * 1024 * 1024) {
                        setMessage("会员最大支持 100M 的图片");
                        return;
                    }
    
                    const { blob, width, height } = await compressImage(file, scalePercentage, 80);
    
                    newCompressedResults.push({
                        name: file.name,
                        url: URL.createObjectURL(blob),
                        originalSize: file.size,
                        compressedSize: blob.size,
                        width: width,
                        height: height,
                        blob: blob
                    });
                } else {
                    setMessage("只支持 JPG 格式的图片");
                    return;
                }
            }
    
            // 将新压缩的结果追加到现有结果中
            setCompressedFiles(prev => [...prev, ...newCompressedResults]);
            setMessage("压缩完成");
            setFiles([]); // 清空当前选择的文件
        } catch (error) {
            setMessage(error.message);
        }
    };

    const handleDownload = (url, name) => {
        const link = document.createElement("a");
        link.href = url;
        link.download = `compressed_${name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadAllAsZip = async () => {
        const zip = new JSZip();
        const imgFolder = zip.folder("compressed_images");

        compressedFiles.forEach((file, index) => {
            imgFolder.file(`compressed_${file.name}`, file.blob);
        });

        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, "compressed_images.zip");
    };

    const handleDownloadAllAsSeparate = () => {
        compressedFiles.forEach((file) => {
            handleDownload(file.url, file.name);
        });
    };

    const handlePreview = (url, originalSize) => {
        setPreviewImage(url);
        setOriginalSize(originalSize);
    };

    const handleClosePreview = () => {
        setPreviewImage(null);
        setOriginalSize(0);
    };

    const handleDelete = (index) => {
        const newFiles = [...files];
        newFiles.splice(index, 1);
        setFiles(newFiles);
    };

    const handleReset = () => {
        setFiles([]);
        setCompressedFiles([]);
        setMessage("");
        setCompressionQuality(80);
        setScalePercentage(50);
        setShowUploadArea(true);
    };

    return (
        <div className="imageystool-container">
            <h1 className="imageystool-title">图片压缩工具</h1>

            {/* Upload area */}
            {showUploadArea && (
                <>
                    <div
                        className="imageystool-upload-area"
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onClick={() => document.querySelector(".imageystool-file-input").click()}
                    >
                        {files.length === 0 ? (
                            <p>点击或拖放上传图片</p>
                        ) : (
                            <p>已选择 {files.length} 张图片，点击继续添加</p>
                        )}
                        <input
                            type="file"
                            className="imageystool-file-input"
                            multiple
                            accept="image/jpeg, image/jpg"
                            onChange={handleFileChange}
                        />
                    </div>

                    {/* Uploaded images preview */}
                    {files.length > 0 && (
                        <div className="imageystool-preview-upload-container">
                            {files.map((file, index) => (
                                <div key={index} className="imageystool-preview-upload-item">
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt={`预览 ${index + 1}`}
                                        onClick={() => handlePreview(URL.createObjectURL(file), file.size)}
                                    />
                                    <button
                                        className="imageystool-delete-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(index);
                                        }}
                                    >
                                        删除
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Compression options */}
                    {files.length > 0 && (
                        <div className={`imageystool-options ${isMobile ? 'mobile' : ''}`}>
                            <div className="imageystool-option">
                                <label>缩放比例: {scalePercentage}%</label>
                                <input
                                    type="range"
                                    min="10"
                                    max="100"
                                    value={scalePercentage}
                                    onChange={handleScaleChange}
                                />
                            </div>
                            <div className="imageystool-option">
                                <label>JPEG质量: {compressionQuality}%</label>
                                <input
                                    type="range"
                                    min="10"
                                    max="100"
                                    value={compressionQuality}
                                    onChange={handleQualityChange}
                                />
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Message */}
            {message && <p className="imageystool-message">{message}</p>}

            {/* Compressed images preview */}
            {compressedFiles.length > 0 && (
                <div className="imageystool-preview-scroll">
                    <div className="imageystool-preview-container">
                        {compressedFiles.map((file, index) => (
                            <div key={index} className="imageystool-preview-item">
                                <img
                                    src={file.url}
                                    alt={`压缩图片 ${index + 1}`}
                                    onClick={() => handlePreview(file.url, file.originalSize)}
                                />
                                <div className="imageystool-preview-info">
                                    <p>原始: {Math.round(file.width * (100 / scalePercentage))} × {Math.round(file.height * (100 / scalePercentage))}</p>
                                    <p>缩放: {file.width} × {file.height}</p>
                                    <p>大小: {(file.originalSize / 1024).toFixed(2)}KB → {(file.compressedSize / 1024).toFixed(2)}KB</p>
                                    <button
                                        className="imageystool-download-btn"
                                        onClick={() => handleDownload(file.url, file.name)}
                                    >
                                        下载
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Preview modal */}
            {previewImage && (
                <div className="imageystool-preview-modal">
                    <div className="imageystool-preview-modal-content">
                        <span className="imageystool-close" onClick={handleClosePreview}>&times;</span>
                        <img src={previewImage} alt="大图预览" className="imageystool-preview-large" />
                        <p>原始大小: {(originalSize / 1024).toFixed(2)} KB</p>
                    </div>
                </div>
            )}

            {/* Fixed action buttons */}
            <div className="imageystool-action-buttons">
                {files.length > 0 && showUploadArea && (
                    <button className="imageystool-compress-btn" onClick={handleCompress}>
                        开始压缩图片
                    </button>
                )}

                {compressedFiles.length > 0 && (
                    <>
                        <button className="imageystool-reset-btn" onClick={handleReset}>
                            重新上传
                        </button>
                        <div className="imageystool-download-options">
                            <button className="imageystool-download-all-btn" onClick={handleDownloadAllAsSeparate}>
                                全部下载(单张)
                            </button>
                            <button className="imageystool-download-zip-btn" onClick={handleDownloadAllAsZip}>
                                全部下载(ZIP)
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ImageCompressionTool;
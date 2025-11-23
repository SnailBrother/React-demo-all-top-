import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from 'react-router-dom';
import axios from "axios";
import "./UploadHousePricePicture.css";
import WordReportGeneratorLoader from '../../accounting/Notification/WordReportGeneratorLoader';

const UploadHousePricePicture = () => {
  // 修改页面标题
  useEffect(() => {
    document.title = '照片上传';
  }, []);
  
  // 使用useSearchParams获取查询参数
  const [searchParams] = useSearchParams();
  // 从查询参数中获取reportsID和location
  const reportsID = searchParams.get('reportsID') || "";
  const location = searchParams.get('location') || "";
  
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [hoveredImage, setHoveredImage] = useState(null);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [existingImages, setExistingImages] = useState([]);

  // 获取已存在的图片列表
  useEffect(() => {
    if (reportsID) {
      fetchExistingImages();
    }
  }, [reportsID]);

  const fetchExistingImages = async () => {
    try {
      const response = await axios.get(`/cyywork/api/GetHousePricePictures?reportsID=${reportsID}`);
      if (response.data.success) {
        setExistingImages(response.data.images || []);
      }
    } catch (error) {
      console.error('获取已存在图片失败:', error);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // 检查重复文件
    const newFiles = selectedFiles.filter(newFile => {
      // 检查是否与已选择的文件重复
      const isDuplicateInSelection = files.some(existingFile => 
        existingFile.name === newFile.name && existingFile.size === newFile.size
      );
      
      // 检查是否与服务器上已存在的文件重复
      const isDuplicateInServer = existingImages.some(existingImage => 
        existingImage.pictureFileName === newFile.name
      );
      
      if (isDuplicateInSelection) {
        setMessage(`文件 "${newFile.name}" 已经在选择列表中`);
        return false;
      }
      
      if (isDuplicateInServer) {
        setMessage(`文件 "${newFile.name}" 已在服务器存在，请勿重复上传`);
        return false;
      }
      
      return true;
    });
    
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
    e.target.value = ''; // 重置文件输入
  };

  const handleRemoveFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
  };

  const handleUpload = async () => {
    if (!reportsID || !location) {
      setMessage("请确保报告ID和坐落信息完整");
      return;
    }

    if (files.length === 0) {
      setMessage("请选择至少一张图片");
      return;
    }

    // 文件格式和大小验证
    for (const file of files) {
      if (!file.type.match(/image\/jpeg/)) {
        setMessage("只支持 .jpg 或 .jpeg 格式的图片");
        return;
      }
      if (file.size > 300 * 1024) {
        setMessage(`图片 "${file.name}" 大小不能超过 300KB`);
        return;
      }
    }

    setIsLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("reportsID", reportsID);
    formData.append("location", location);
    files.forEach((file) => {
      formData.append("images", file);
    });

    try {
      const response = await axios.post("/cyywork/api/UploadHousePricePicture", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      setMessage(response.data.message);
      
      // 上传成功后清空文件列表并刷新已存在图片列表
      if (response.data.success) {
        setFiles([]);
        fetchExistingImages();
      }
      
    } catch (error) {
      setMessage("上传失败：" + (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const showOverlay = (file) => {
    setHoveredImage(file);
    setIsOverlayVisible(true);
  };

  const hideOverlay = () => {
    setIsOverlayVisible(false);
    setHoveredImage(null);
  };

  return (
    <div className="uphpPicture-container">
      {/* 加载动画 */}
      {isLoading && <WordReportGeneratorLoader />}
      
      <div className="uphpPicture-header">
        <h2>{reportsID} - {location}</h2>
        <p className="uphpPicture-instructions">请上传相关图片 (仅支持JPG格式，最大300KB)</p>
        
        {/* 显示已存在的图片数量 */}
        {existingImages.length > 0 && (
          <p className="uphpPicture-existing-info">
            当前报告已有 {existingImages.length} 张图片
          </p>
        )}
      </div>

      <div className="uphpPicture-area">
        {files.length === 0 ? (
          <label htmlFor="file-upload" className="uphpPicture-prompt">
            <div className="uphpPicture-icon">
              <svg viewBox="0 0 24 24" width="48" height="48">
                <path fill="#888" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
              </svg>
            </div>
            <p>点击或拖拽文件到此处上传</p>
            <p className="uphpPicture-hint">支持JPG格式，最大300KB</p>
            {existingImages.length > 0 && (
              <p className="uphpPicture-warning-hint">
                注意：重复的图片名称将不会被上传
              </p>
            )}
          </label>
        ) : (
          <div className="uphpPicture-file-list-container">
            <label htmlFor="file-upload" className="uphpPicture-add-more-button">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="#fff" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
              </svg>
              添加更多图片
            </label>
            <div className="uphpPicture-preview-grid">
              {files.map((file, index) => (
                <div key={index} className="uphpPicture-preview-item">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`preview-${index}`}
                    className="uphpPicture-preview-image"
                  />
                  <div className="uphpPicture-preview-actions">
                    <button 
                      className="uphpPicture-action-button uphpPicture-enlarge" 
                      onClick={() => showOverlay(file)}
                      title="放大"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="#fff" d="M15.5,14L20.5,19L19,20.5L14,15.5V14.71L13.73,14.43C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.43,13.73L14.71,14H15.5M9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14M12,10H10V12H9V10H7V9H9V7H10V9H12V10Z" />
                      </svg>
                    </button>
                    <button 
                      className="uphpPicture-action-button uphpPicture-delete" 
                      onClick={() => handleRemoveFile(index)}
                      title="删除"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="#fff" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                      </svg>
                    </button>
                  </div>
                  <div className="uphpPicture-file-info">
                    <span className="uphpPicture-file-name">{file.name}</span>
                    <span className="uphpPicture-file-size">{(file.size / 1024).toFixed(1)}KB</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <input
          id="file-upload"
          type="file"
          multiple
          accept=".jpg,.jpeg"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>

      {files.length > 0 && (
        <div className="uphpPicture-actions">
          <button 
            className="uphpPicture-button" 
            onClick={handleUpload}
            disabled={isLoading}
          >
            {isLoading ? '上传中...' : '上传图片'}
          </button>
          <span className="uphpPicture-selected-count">
            已选择 {files.length} 张图片
          </span>
        </div>
      )}

      {message && (
        <div className={`uphpPicture-message ${message.includes('失败') || message.includes('错误') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {isOverlayVisible && (
        <div className="uphpPicture-overlay" onClick={hideOverlay}>
          <div className="uphpPicture-overlay-content" onClick={e => e.stopPropagation()}>
            <img
              src={URL.createObjectURL(hoveredImage)}
              alt="放大预览"
              className="uphpPicture-zoomed-image"
            />
            <button className="uphpPicture-close-button" onClick={hideOverlay}>
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadHousePricePicture;
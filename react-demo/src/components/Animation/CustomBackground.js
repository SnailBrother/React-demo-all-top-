import React, { useContext, useState, useEffect } from 'react';
import './CustomBackground.css';
import { AuthContext } from '../../context/AuthContext';
import io from 'socket.io-client';

// 创建Socket.IO连接
const socket = io('http://121.4.22.55:5201', {
  transports: ['websocket', 'polling']
});

const CustomBackground = () => {
  const { username } = useContext(AuthContext);
  const [imageSrc, setImageSrc] = useState('');
  const [imageTimestamp, setImageTimestamp] = useState(Date.now());

  useEffect(() => {
    // 检查用户自定义背景图片是否存在
    const checkImageExists = (url, callback) => {
      const img = new Image();
      img.onload = () => callback(true);
      img.onerror = () => callback(false);
      img.src = url;
    };

    if (username) {
       const userImageUrl = `http://121.4.22.55:80/backend/images/SystemThemesettings/${username}/CustomBackground.jpg?t=${imageTimestamp}`;
      
      checkImageExists(userImageUrl, (exists) => {
        if (exists) {
          setImageSrc(userImageUrl);
        } else {
          // 使用默认背景图片
          setImageSrc('http://121.4.22.55:80/backend/images/SystemThemesettings/CustomBackground.jpg');
        }
      });
    }
  }, [username, imageTimestamp]);
 // 监听背景图片更新事件
  useEffect(() => {
    socket.on('background-image-updated', (data) => {
      if (data.username === username) {
        // 更新时间戳以强制刷新图片
        setImageTimestamp(data.timestamp || Date.now());
      }
    });

    // 加入用户特定的房间
    if (username) {
      socket.emit('join-user-room', username);
    }

    return () => {
      socket.off('background-image-updated');
    };
  }, [username]);
  
  return (
    <div className="customBackground-container">
      {imageSrc && (
        <img 
          src={imageSrc}
          alt="Custom Background" 
          className="customBackground-image"
          onError={(e) => {
            // 如果图片加载失败，使用默认图片
            e.target.src = 'http://121.4.22.55:80/backend/images/SystemThemesettings/CustomBackground.jpg';
          }}
        />
      )}
    </div>
  );
};

export default CustomBackground;


// src="http://121.4.22.55:80/backend/images/SystemThemesettings/李中敬/CustomBackground.jpg"

import React from 'react';
import { useNavigate } from 'react-router-dom';
import './TravelManager.css';

const TravelManager = () => {
  const navigate = useNavigate();

  // 模拟旅行数据 - 每个旅行指定对应的路由组件
  const travels = [
    {
      id: 'first-time',
      title: '夏天',
      destination: '重庆',
      date: '2023-01-15',
      duration: '365天',
      image: '/images/Travel-FirstTime-Cover.jpg',
      description: '探索重庆主城',
      route: 'FirstTimeTravel' // 指定路由组件名称
    },
    {
      id: 'second-time',
      title: '冬天',
      destination: '区县',
      date: '2024-03-20',
      duration: '365天',
      image: '/images/Travel-SecondTime-Cover.jpg',
      description: '探索周边',
      route: 'SecondTimeTravel'  
    } 
 
  ];

  // 处理卡片点击
  const handleCardClick = (travel) => {
    // 使用 travel.route 作为路由路径
    navigate(`/app/travelmanager/${travel.route}`);
  };

 

  return (
    <div className="travel-manager">
 

      <div className="travel-cards-container">
        {travels.map((travel, index) => (
          <div
            key={travel.id}
            className="travel-card"
            onClick={() => handleCardClick(travel)}
          >
            <div className="card-header">
              <span className="travel-number">第{index + 1}回合</span>
              <span className="travel-date">{travel.date}</span>
            </div>
            
            <div className="card-image">
              <img 
                src={travel.image} 
                alt={travel.title}
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIwLjM1ZW0iPuWbvuWDj+WbvueBhzwvdGV4dD48L3N2Zz4=';
                }}
              />
            </div>
            
            <div className="card-content">
              <h3 className="travel-title">{travel.title}</h3>
              <div className="travel-info">
                <div className="info-item">
                  <span className="icon">📍</span>
                  <span>{travel.destination}</span>
                </div>
                <div className="info-item">
                  <span className="icon">⏱️</span>
                  <span>{travel.duration}</span>
                </div>
              </div>
              <p className="travel-description">{travel.description}</p>
            </div>
            
             
          </div>
        ))}
      </div>
    </div>
  );
};

export default TravelManager;
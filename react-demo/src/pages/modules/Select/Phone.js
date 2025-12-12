import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { moduleConfig } from '../../../config/moduleConfig';
import styles from './Phone.module.css';

const Phone = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState({
    date: '',
    weekday: '',
    hourMin: ''
  });

  // 生成模块数据
  const modules = Object.entries(moduleConfig).map(([key, config]) => ({
    key,
    title: config.label,
    routes: config.routes,
    defaultPath: `/app/${key}/${config.defaultRoute}`,
    emoji: getModuleEmoji(key),
    color: getModuleColor(key)
  }));

  function getModuleEmoji(key) {
    const emojiMap = {
      accounting: '📊',
      music: '🎵',
      outfit: '👗',
      office: '💼',
      chat: '💬',
      travelmanager: '✈️',
      system: '⚙️',
      tool: '🛠️',
      travel: '🧳',
    };
    return emojiMap[key] || '📱';
  }

  function getModuleColor(key) {
    const colorMap = {
      accounting: '#10b981',
      music: '#8b5cf6',
      outfit: '#f59e0b',
      office: '#3b82f6',
      chat: '#ec4899',
      travelmanager: '#06b6d4',
      system: '#6b7280',
      tool: '#84cc16',
      travel: '#f97316'
    };
    return colorMap[key] || '#6b7280';
  }

  // 更新当前时间（仅用于显示，指针由 updateClockPointers 控制）
  const updateCurrentTime = () => {
    const now = new Date();

    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');

    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekday = weekdays[now.getDay()];

    const hour = now.getHours().toString().padStart(2, '0');
    const minute = now.getMinutes().toString().padStart(2, '0');

    setCurrentTime({
      date: `${year}/${month}/${day}`,
      weekday,
      hourMin: `${hour}:${minute}`
    });

    updateClockPointers(now);
  };

  const updateClockPointers = (now) => {
    const hour = now.getHours() % 12;
    const minute = now.getMinutes();

    const hourAngle = (hour * 30) + (minute * 0.5);
    const minuteAngle = minute * 6;

    const hourHands = document.querySelectorAll(`.${styles.clockHour}`);
    const minuteHands = document.querySelectorAll(`.${styles.clockMinute}`);

    hourHands.forEach(hand => {
      hand.style.transform = `rotate(${hourAngle}deg)`;
    });

    minuteHands.forEach(hand => {
      hand.style.transform = `rotate(${minuteAngle}deg)`;
    });
  };

  useEffect(() => {
    updateCurrentTime();
    const intervalId = setInterval(updateCurrentTime, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const goToModule = (defaultPath) => navigate(defaultPath);

  return (
    <div className={styles.container}>
      {/* 顶部栏 */}
      <div className={styles.header}>
        <div className={styles.headercolumnone}>
          <div className={styles.headerrowtavatar}>
            <img
              src="http://121.4.22.55:80/logo192.png"
              alt="头像"
              className={styles.avatarimg}
            />
          </div>
        </div>

        <div className={styles.headercolumntwo}>
          <div className={styles.Card}>
            <div className={styles.clockWrap}>
              <div className={styles.clockFace}>
                <div className={styles.clockHour}></div>
                <div className={styles.clockMinute}></div>
              </div>
            </div>
            <div className={styles.timeText}>
              <div className={styles.date}>{currentTime.date} {currentTime.weekday}</div>
              <div className={styles.hourMin}>{currentTime.hourMin}</div>
            </div>
          </div>

          <div className={styles.Card}>
            <svg className={styles.titleicon} aria-hidden="true">
              <use xlinkHref="#icon-a-fengcheertongleyuanyoulechang"></use>
            </svg>
            <svg className={styles.titleicon} aria-hidden="true">
              <use xlinkHref="#icon-fengche"></use>
            </svg>
            <svg className={styles.titleicon} aria-hidden="true">
              <use xlinkHref="#icon-a-fengcheertongleyuanyoulechang"></use>
            </svg>
            <svg className={styles.titleicon} aria-hidden="true">
              <use xlinkHref="#icon-fengche_windmill-two"></use>
            </svg>

          </div>

        </div>
      </div>

      {/* 名下作品区域 - 可滚动 */}
      <div className={styles.maincontent}>
        <div className={styles.worksCard}>
          <div className={styles.worksTitle}>名下作品</div>
          <div className={styles.worksTitlecontent}>
            {modules.map((module) => (
              <div
                key={module.key}
                className={styles.moduleItem}
                onClick={() => goToModule(module.defaultPath)}
              >
                <div className={styles.moduleIcon}>
                  <div
                    className={styles.moduleIconCircle}
                    style={{ backgroundColor: module.color }}
                  >
                    <span className={styles.moduleEmoji}>{module.emoji}</span>
                  </div>
                </div>

                <div className={styles.moduleInfo}>
                  <div className={styles.moduleName}>{module.title}</div>
                  <div className={styles.moduleTags}>
                    {module.routes.slice(0, 5).map((route) => (
                      <span
                        key={route.key}
                        className={styles.moduleTag}
                        style={{
                          backgroundColor: `${module.color}20`,
                          color: module.color,
                          borderColor: `${module.color}40`
                        }}
                      >
                        {route.label}
                      </span>
                    ))}
                    {module.routes.length > 5 && (
                      <span className={styles.moduleMoreTag}>
                        +{module.routes.length - 5}更多
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.moduleMeta}>
                  <div className={styles.moduleAction}>
                    <svg className={styles.moduleArrowIcon} aria-hidden="true">
                      <use xlinkHref="#icon-jiantou_xiangyouliangci"></use>
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Phone;
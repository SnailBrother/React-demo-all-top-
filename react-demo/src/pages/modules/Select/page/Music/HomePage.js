import React, { useState } from 'react';
import styles from './HomePage.module.css';

const HomePage = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  // 第一屏内容数据
  const firstPageContents = [
    {
      id: 0,
      img: 'http://121.4.22.55:80/backend/images/WebsiteHomepageImage/Music/收藏记录.jpg',
      texts: [
        '无论对谁太过热情，就增加了不被珍惜的概率',
        '若能避开猛烈的狂喜，自然不会有悲痛袭来。——《人间失格》',
        '爱意随风起，自然知湫意。'
      ]
    },
    {
      id: 1,
      img: 'http://121.4.22.55:80/backend/images/WebsiteHomepageImage/Music/一听听歌.jpg',
      texts: [
        '在最黑暗的那段人生，是我自己把我自己拉出深渊',
        '没有那个人，我就做那个人——中岛美嘉'
      ]
    },
    {
      id: 2,
      img: 'http://121.4.22.55:80/backend/images/WebsiteHomepageImage/Music/音乐听歌.jpg',
      texts: [
        '生命是有关光的，在我熄灭以前',
        '能够照亮你一点，就是我所有能做的的了',
        '我爱你，你要记得我——《云边有个小卖部》'
      ]
    },
    {
      id: 3,
      img: 'http://121.4.22.55:80/backend/images/WebsiteHomepageImage/Music/音乐推荐.jpg',
      texts: [
        '带我回家',
        '待我回家',
        '代我回家'
      ]
    },
    {
      id: 4,
      img: 'http://121.4.22.55:80/backend/images/WebsiteHomepageImage/Music/音乐欣赏.jpg',
      texts: [
        '去年夏天，我遇到一个女孩，他的出现让我放下了从前',
        '我真的很喜欢她，虽然和她没有以后了',
        '但依旧祝她岁岁平安'
      ]
    },
    {
      id: 5,
      img: 'http://121.4.22.55:80/backend/images/WebsiteHomepageImage/Music/音乐欣赏.jpg',
      texts: [
        '浅浅喜，静静爱',
        '深深懂得，淡淡释怀',
        '望远处是风景，看近处才是人生！'
      ]
    },
    {
      id: 6,
      img: 'http://121.4.22.55:80/backend/images/WebsiteHomepageImage/Music/音乐欣赏.jpg',
      texts: [
        '你要咽的下这世间的不美好',
        '才配得上这世上一切的美好'
      ]
    }
  ];

  return (
    <>
      {/* 背景圆点 */}
      <div className={styles.circle1}></div>
      <div className={styles.circle2}></div>
      <div className={styles.circle3}></div>
      
      {/* 内容区域 */}
      <main className={styles.main}>
        <div className={styles.mainLeft}>
          <div className={`${styles.myPhoto} ${activeIndex === 0 ? styles.current : ''}`}>
            <a href="#">
              <img src="./img/myphoto.jpg" alt="Weirry Lu" />
              <h3>Weirry Lu</h3>
              <p>唯有落叶🍂知湫意</p>
            </a>
          </div>
          
          {['首页', '关于', '电话', '邮箱', '微信', '更多'].map((text, index) => (
            <div 
              key={index}
              className={activeIndex === index + 1 ? styles.current : ''}
              onMouseEnter={() => setActiveIndex(index + 1)}
            >
              <a href="#">
                <p className={styles[`icon${text}`]}></p>
                <span>{text}</span>
              </a>
            </div>
          ))}
        </div>

        <div className={styles.mainRight}>
          {firstPageContents.map((content, index) => (
            <div 
              key={content.id}
              className={`${styles.content} ${activeIndex === index + 1 ? '' : styles.hidden}`}
              style={{ display: activeIndex === index + 1 ? 'flex' : 'none' }}
            >
              <img 
                src={content.img} 
                alt="" 
                className={index === 0 ? styles.firstContent : ''}
              />
              <div>
                {content.texts.map((text, i) => (
                  <p key={i}>{text}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
};

export default HomePage;
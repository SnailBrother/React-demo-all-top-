import React, { useState } from 'react';
import styles from './ProfilePage.module.css';

const ProfilePage = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  // 第二屏内容数据
  const pageContents = [
    {
      id: 0,
      img: 'http://121.4.22.55:80/backend/images/WebsiteHomepageImage/Music/音乐欣赏.jpg',
      texts: [
        '💘',
        '姓名：卢大天才',
        '性别：男',
        '生日：1999/03/19',
        '爱好：羽毛球，唱歌，王者',
        '星座：双鱼',
        '落叶🍂知湫意',
        '爱意💕随风起',
        '💓'
      ]
    },
    {
      id: 1,
      img: 'http://121.4.22.55:80/backend/images/WebsiteHomepageImage/Music/音乐欣赏.jpg',
      texts: [
        '💘',
        '《起风了》',
        '💓'
      ]
    },
    {
      id: 2,
      img: 'http://121.4.22.55:80/backend/images/WebsiteHomepageImage/Music/音乐欣赏.jpg',
      texts: [
        '💘',
        '这一路上走走停停',
        '顺着少年漂流的痕迹',
        '迈出车站的前一刻',
        '竟有些犹豫',
        '不禁笑这近乡情怯',
        '仍无可避免，而长野的天',
        '依旧那么暖，风吹起了从前💕',
        '💓'
      ]
    },
    {
      id: 3,
      img: 'http://121.4.22.55:80/backend/images/WebsiteHomepageImage/Music/音乐欣赏.jpg',
      texts: [
        '💘',
        'QQ大号：5201314',
        'QQ小号：58814169',
        '💓'
      ]
    },
    {
      id: 4,
      img: 'http://121.4.22.55:80/backend/images/WebsiteHomepageImage/Music/音乐欣赏.jpg',
      texts: [
        '💘',
        '落叶🍂知湫意',
        '微信：哇哈哈',
        '爱意💕随风起',
        '💓'
      ]
    },
    {
      id: 5,
      img: 'http://121.4.22.55:80/backend/images/WebsiteHomepageImage/Music/音乐欣赏.jpg',
      texts: [
        '💘',
        '太杂了，不知道说什么好！！！',
        '💓'
      ]
    }
  ];

  const navItems = ['个人资料', '个人图片', '个人技能', '个人QQ', '个人微信', '杂七杂八'];

  return (
    <>
      <div className={styles.circle1}></div>
      <div className={styles.circle2}></div>
      <div className={styles.circle3}></div>

      <div className={styles.sectionCenter}>
        <div className={styles.main}>
          <div className={styles.mainHead}>
            <ul>
              {navItems.map((item, index) => (
                <li 
                  key={index}
                  className={activeIndex === index ? styles.current : ''}
                  onClick={() => setActiveIndex(index)}
                >
                  <a href="#">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.mainBody}>
            {pageContents.map((content, index) => (
              <div 
                key={content.id}
                className={`${styles.mainBodyContent} ${activeIndex === index ? '' : styles.hidden}`}
                style={{ display: activeIndex === index ? 'flex' : 'none' }}
              >
                <div className={styles.mainBodyContentLeft}>
                  {content.texts.map((text, i) => (
                    <p key={i}>{text}</p>
                  ))}
                </div>
                <div className={styles.mainBodyContentRight}>
                  <img src={content.img} alt="" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
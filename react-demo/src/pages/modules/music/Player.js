import React, { useState } from 'react';
import { Input } from '../../../components/UI';

const MusicPlayer = () => {
  const [current, setCurrent] = useState('');
  return (
    <div>
      <h2>音乐 - 播放器</h2>
      <Input value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="当前歌曲测试缓存" />
    </div>
  );
};

export default MusicPlayer;



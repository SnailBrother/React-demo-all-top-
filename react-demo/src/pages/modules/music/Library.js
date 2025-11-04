import React, { useState } from 'react';
import { Input } from '../../../components/UI';

const MusicLibrary = () => {
  const [filter, setFilter] = useState('');
  return (
    <div>
      <h2>音乐 - 曲库</h2>
      <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="过滤条件测试缓存" />
    </div>
  );
};

export default MusicLibrary;



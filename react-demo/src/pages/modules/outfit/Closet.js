import React, { useState } from 'react';

const OutfitCloset = () => {
  const [search, setSearch] = useState('');
  return (
    <div>
      <h2>穿搭 - 衣橱</h2>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索衣物测试缓存" />
    </div>
  );
};

export default OutfitCloset;



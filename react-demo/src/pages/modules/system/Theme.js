import React, { useRef } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { Button, Input } from '../../../components/UI';

const SystemThemeSettings = () => {
  const { theme, toggleTheme, changeTheme, settings, updateSettings } = useTheme();
  const fileRef = useRef(null);

  const onBgSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateSettings({ backgroundImage: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const clearBg = () => updateSettings({ backgroundImage: '' });

  return (
    <div>
      <h2>系统设置 - 主题</h2>
      <div style={{ display: 'grid', gap: 12, maxWidth: 480 }}>
        <div>
          <label>主题模式：</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => changeTheme('light')}>浅色</button>
            <button onClick={() => changeTheme('dark')}>深色</button>
            <button onClick={toggleTheme}>切换</button>
          </div>
        </div>
        <div>
          <label htmlFor="primaryColor">主色：</label>
          <input
            id="primaryColor"
            type="color"
            value={settings.primaryColor}
            onChange={(e) => updateSettings({ primaryColor: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="fontSize">基础字体大小：</label>
          <input
            id="fontSize"
            type="number"
            min={12}
            max={22}
            value={settings.fontSize}
            onChange={(e) => updateSettings({ fontSize: Number(e.target.value || 14) })}
          />
        </div>
        <div>
          <label>背景图片：</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => fileRef.current?.click()}>选择本地图片</button>
            {settings.backgroundImage && <button onClick={clearBg}>清除</button>}
            <input ref={fileRef} type="file" accept="image/*" onChange={onBgSelect} style={{ display: 'none' }} />
          </div>
          {settings.backgroundImage && (
            <div style={{ marginTop: 8 }}>
              <img src={settings.backgroundImage} alt="预览" style={{ width: 240, height: 'auto', borderRadius: 8 }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemThemeSettings;



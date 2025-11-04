// src/components/pages/modules/system/CustomThemeCreator.js
//自定义主题组件 
import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';

const CustomThemeCreator = () => {
  const {
    customThemes,
    currentCustomTheme,
    saveCustomTheme,
    applyCustomTheme,
    deleteCustomTheme,
    updateCustomTheme,
    settings,
    THEME_PRESETS
  } = useTheme();

  const [themeName, setThemeName] = useState('');
  const [editingTheme, setEditingTheme] = useState(null);
  const [themeSettings, setThemeSettings] = useState({
    primaryColor: '#3b82f6',
    fontSize: 14,
    bgColor: '#ffffff',
    surfaceColor: '#f8f9fa',
    textColor: '#212529',
    textMuted: '#6c757d',
    borderColor: '#dee2e6'
  });

  // 初始化或编辑时加载设置
  useEffect(() => {
    if (editingTheme && customThemes[editingTheme]) {
      setThemeSettings(customThemes[editingTheme].settings);
      setThemeName(editingTheme);
    } else {
      // 新建时使用当前设置
      setThemeSettings({
        primaryColor: settings.primaryColor,
        fontSize: settings.fontSize,
        bgColor: settings.bgColor,
        surfaceColor: settings.surfaceColor,
        textColor: settings.textColor,
        textMuted: settings.textMuted,
        borderColor: settings.borderColor
      });
    }
  }, [editingTheme, customThemes, settings]);

  // 添加确认对话框函数
  const showConfirmDialog = (message) => {
    return window.confirm(message);
  };

  // 添加提示函数
  const showAlert = (message) => {
    window.alert(message);
  };

  const handleSaveTheme = () => {
    if (!themeName.trim()) {
      showAlert('请输入主题名称');
      return;
    }

    if (customThemes[themeName] && !editingTheme) {
      showAlert('主题名称已存在，请使用其他名称');
      return;
    }

    saveCustomTheme(themeName, themeSettings);
    setThemeName('');
    setEditingTheme(null);
    showAlert('主题保存成功！');
  };

  const handleUpdateTheme = () => {
    if (!editingTheme) return;
    
    updateCustomTheme(editingTheme, themeSettings);
    setEditingTheme(null);
    setThemeName('');
    showAlert('主题更新成功！');
  };

  const handleSettingChange = (key, value) => {
    setThemeSettings(prev => ({
      ...prev,
      [key]: key === 'fontSize' ? Number(value) : value
    }));
  };

  const startEditing = (themeName) => {
    setEditingTheme(themeName);
  };

  const cancelEditing = () => {
    setEditingTheme(null);
    setThemeName('');
  };

  const quickApplyPreset = (presetName) => {
    const preset = THEME_PRESETS[presetName];
    if (preset) {
      setThemeSettings(prev => ({ ...prev, ...preset }));
    }
  };

  const handleDeleteTheme = (themeName) => {
    if (showConfirmDialog(`确定要删除主题 "${themeName}" 吗？`)) {
      deleteCustomTheme(themeName);
    }
  };

  return (
    <div style={{ marginTop: 24, padding: 16, border: '1px solid var(--border-color)', borderRadius: 8 }}>
      <h3>🎨 自定义主题</h3>
      
      {/* 快速应用预设 */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8 }}>快速应用预设：</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => quickApplyPreset('light')}>浅色</button>
          <button onClick={() => quickApplyPreset('dark')}>深色</button>
          <button onClick={() => quickApplyPreset('female')}>女性</button>
          <button onClick={() => quickApplyPreset('male')}>男性</button>
          <button onClick={() => quickApplyPreset('middle')}>中年</button>
        </div>
      </div>

      {/* 主题变量编辑器 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 12,
        marginBottom: 16
      }}>
        {Object.entries(themeSettings).map(([key, value]) => (
          <div key={key}>
            <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
              {key === 'primaryColor' ? '主色' :
               key === 'fontSize' ? '字体大小' :
               key === 'bgColor' ? '背景色' :
               key === 'surfaceColor' ? '表面色' :
               key === 'textColor' ? '文字色' :
               key === 'textMuted' ? '次要文字' :
               key === 'borderColor' ? '边框色' : key}:
            </label>
            {key.includes('Color') ? (
              <input
                type="color"
                value={value}
                onChange={(e) => handleSettingChange(key, e.target.value)}
                style={{ width: '100%', height: 40 }}
              />
            ) : key === 'fontSize' ? (
              <select
                value={value}
                onChange={(e) => handleSettingChange(key, e.target.value)}
                style={{ width: '100%', padding: 8 }}
              >
                <option value={12}>12px</option>
                <option value={14}>14px</option>
                <option value={16}>16px</option>
                <option value={18}>18px</option>
                <option value={20}>20px</option>
              </select>
            ) : (
              <input
                type="text"
                value={value}
                onChange={(e) => handleSettingChange(key, e.target.value)}
                style={{ width: '100%', padding: 8 }}
              />
            )}
          </div>
        ))}
      </div>

      {/* 主题名称和操作按钮 */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
        <input
          placeholder="输入主题名称"
          value={themeName}
          onChange={(e) => setThemeName(e.target.value)}
          style={{ padding: 8, flex: 1, borderRadius: 4, border: '1px solid var(--border-color)' }}
        />
        {editingTheme ? (
          <>
            <button onClick={handleUpdateTheme} style={{ padding: '8px 16px' }}>
              更新主题
            </button>
            <button onClick={cancelEditing} style={{ padding: '8px 16px' }}>
              取消
            </button>
          </>
        ) : (
          <button onClick={handleSaveTheme} style={{ padding: '8px 16px' }}>
            保存新主题
          </button>
        )}
      </div>

      {/* 已保存的主题列表 */}
      {Object.keys(customThemes).length > 0 && (
        <div>
          <h4>已保存的主题</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(customThemes).map(([name, themeData]) => (
              <div
                key={name}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 12,
                  border: `1px solid var(--border-color)`,
                  borderRadius: 4,
                  backgroundColor: 'var(--surface-color)'
                }}
              >
                <div>
                  <strong>{name}</strong>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    创建于: {new Date(themeData.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => applyCustomTheme(name)}
                    disabled={currentCustomTheme === name}
                    style={{ 
                      opacity: currentCustomTheme === name ? 0.6 : 1,
                      padding: '4px 8px'
                    }}
                  >
                    {currentCustomTheme === name ? '已应用' : '应用'}
                  </button>
                  <button 
                    onClick={() => startEditing(name)}
                    style={{ padding: '4px 8px' }}
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDeleteTheme(name)}
                    style={{ padding: '4px 8px', backgroundColor: '#ef4444', color: 'white' }}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomThemeCreator;
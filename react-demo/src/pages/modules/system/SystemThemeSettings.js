// components/ThemeSettings/SystemThemeSettings.js
import React, { useState, useEffect } from 'react';
import { ColorPicker, message } from 'antd';
import { useTheme } from '../../../context/ThemeContext';
import styles from './SystemThemeSettings.module.css';
import Button from '../../../components/UI/Button';

// 辅助函数：确保颜色为8位带透明度的格式
const ensure8DigitHex = (color) => {
  if (!color) return '#FFFFFFFF';

  if (color.startsWith('#') && color.length === 7) {
    return `${color}FF`;
  }

  if (color.startsWith('#') && color.length === 4) {
    const r = color[1];
    const g = color[2];
    const b = color[3];
    return `#${r}${r}${g}${g}${b}${b}FF`;
  }

  if (color.startsWith('#') && color.length === 9) {
    return color;
  }

  if (color.startsWith('rgba')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      const r = parseInt(match[1]).toString(16).padStart(2, '0');
      const g = parseInt(match[2]).toString(16).padStart(2, '0');
      const b = parseInt(match[3]).toString(16).padStart(2, '0');
      const alpha = match[4] ? Math.round(parseFloat(match[4]) * 255).toString(16).padStart(2, '0') : 'FF';
      return `#${r}${g}${b}${alpha}`;
    }
  }

  return '#FFFFFFFF';
};

// 辅助函数：从Ant Design颜色对象获取8位十六进制
const get8DigitHexFromColor = (color) => {
  if (!color) return '#FFFFFFFF';

  if (color && typeof color.toHexString === 'function') {
    const hex = color.toHexString();
    return ensure8DigitHex(hex);
  }

  if (typeof color === 'string') {
    return ensure8DigitHex(color);
  }

  return '#FFFFFFFF';
};

const SystemThemeSettings = () => {
  const {
    currentTheme,
    customThemes,
    previewTheme,
    saveCustomTheme,
    applyCustomTheme,
    deleteCustomTheme,
    updateCustomTheme,
    previewThemeSettings,
    cancelPreview,
    resetToDefault
  } = useTheme();

  const [themeName, setThemeName] = useState('');
  const [editingTheme, setEditingTheme] = useState(null);
  const [customThemeSettings, setCustomThemeSettings] = useState({
    // 背景色
    'background-color': '#FFFFFFFF',
    'secondary-background-color': '#F8F9FAFF',
    'hover_background-color': '#E9ECEEFF',
    'focus_background-color': '#DEE2E6FF',
    
    // 字体颜色
    'font-color': '#000000FF',
    'secondary-font-color': '#6C757DFF',
    'hover_font-color': '#0078D4FF',
    'focus_font-color': '#0056B3FF',
    'watermark-font-color': '#B3B5B6FF',
    'font-family': 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    
    // 边框颜色
    'border_color': '#DEE2E6FF',
    'secondary-border_color': '#E9ECEEFF',
    'hover_border_color': '#0078D4FF',
    'focus_border_color': '#0056B3FF',
    
    // 阴影颜色
    'shadow_color': '#00000019',
    'hover_shadow_color': '#00000026',
    'focus_shadow_color': '#0078D440'
  });

  // 初始化设置
  useEffect(() => {
    if (editingTheme && customThemes[editingTheme]) {
      const themeData = customThemes[editingTheme];
      setCustomThemeSettings(themeData);
      setThemeName(editingTheme);
      // 编辑时立即预览
      previewThemeSettings(themeData);
    } else {
      setCustomThemeSettings({
        // 背景色
        'background-color': '#FFFFFFFF',
        'secondary-background-color': '#F8F9FAFF',
        'hover_background-color': '#E9ECEEFF',
        'focus_background-color': '#DEE2E6FF',
        
        // 字体颜色
        'font-color': '#000000FF',
        'secondary-font-color': '#6C757DFF',
        'hover_font-color': '#0078D4FF',
        'focus_font-color': '#0056B3FF',
        'watermark-font-color': '#B3B5B6FF',
        'font-family': 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        
        // 边框颜色
        'border_color': '#DEE2E6FF',
        'secondary-border_color': '#E9ECEEFF',
        'hover_border_color': '#0078D4FF',
        'focus_border_color': '#0056B3FF',
        
        // 阴影颜色
        'shadow_color': '#00000019',
        'hover_shadow_color': '#00000026',
        'focus_shadow_color': '#0078D440'
      });
    }
  }, [editingTheme, customThemes]);

  // 实时预览主题变化
  useEffect(() => {
    previewThemeSettings(customThemeSettings);
  }, [customThemeSettings]);

  // 处理颜色变化
  const handleColorChange = (key) => (color) => {
    const hex8Digit = get8DigitHexFromColor(color);
    setCustomThemeSettings(prev => ({
      ...prev,
      [key]: hex8Digit
    }));
  };

  const handleSaveTheme = () => {
    if (!themeName.trim()) {
      message.error('请输入主题名称');
      return;
    }

    if (customThemes[themeName] && !editingTheme) {
      message.error('主题名称已存在');
      return;
    }

    if (editingTheme) {
      updateCustomTheme(editingTheme, customThemeSettings);
      setEditingTheme(null);
      message.success('主题更新成功！');
    } else {
      saveCustomTheme(themeName, customThemeSettings);
      message.success('主题保存成功！');
    }
    
    setThemeName('');
  };

  const startEditing = (name) => {
    setEditingTheme(name);
    setThemeName(name);
    const themeData = customThemes[name];
    setCustomThemeSettings(themeData);
    previewThemeSettings(themeData);
  };

  const cancelEditing = () => {
    setEditingTheme(null);
    setThemeName('');
    // 取消编辑时恢复当前主题
    cancelPreview();
  };

  const handleDeleteTheme = (name) => {
    if (window.confirm(`确定删除主题 "${name}" 吗？`)) {
      deleteCustomTheme(name);
      message.success('主题删除成功！');
    }
  };

  const handleSettingChange = (key, value) => {
    setCustomThemeSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 快速应用预设
  const applyPreset = (presetName) => {
    const presets = {
      light: {
        'background-color': '#FFFFFFFF',
        'secondary-background-color': '#F8F9FAFF',
        'hover_background-color': '#E9ECEEFF',
        'font-color': '#000000FF',
        'secondary-font-color': '#6C757DFF',
        'border_color': '#DEE2E6FF',
        'shadow_color': '#00000019'
      },
      dark: {
        'background-color': '#1A1A1AFF',
        'secondary-background-color': '#2D2D2DFF',
        'hover_background-color': '#3D3D3DFF',
        'font-color': '#FFFFFFFF',
        'secondary-font-color': '#B3B3B3FF',
        'border_color': '#495057FF',
        'shadow_color': '#00000080'
      },
      blue: {
        'background-color': '#F0F8FFFF',
        'secondary-background-color': '#E6F2FFFF',
        'hover_background-color': '#D4EBFFFF',
        'font-color': '#003366FF',
        'secondary-font-color': '#0066CCFF',
        'border_color': '#B3D9FFFF',
        'hover_border_color': '#0066CCFF',
        'shadow_color': '#0066CC26'
      }
    };

    if (presets[presetName]) {
      setCustomThemeSettings(prev => ({
        ...prev,
        ...presets[presetName]
      }));
      message.info(`已应用 ${presetName} 预设`);
    }
  };

  return (
    <div className={styles.container}>
      {/* 顶部标题和状态 */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          <svg className={styles.icon} aria-hidden="true">
            <use xlinkHref="#icon-pifu"></use>
          </svg>
          主题设置
          {previewTheme && <span className={styles.previewBadge}>预览模式</span>}
        </h1>
        <div className={styles.current}>
          <span className={styles.currentLabel}>当前主题:</span>
          <span className={styles.currentName}>
            {currentTheme === 'default' ? '默认主题' : currentTheme}
          </span>
          {previewTheme && (
            <button 
              className={styles.btnOutline}
              onClick={cancelPreview}
            >
              取消预览
            </button>
          )}
          {currentTheme !== 'default' && !previewTheme && (
            <button 
              className={styles.btnOutline}
              onClick={resetToDefault}
            >
              恢复默认
            </button>
          )}
        </div>
      </div>

      <div className={styles.content}>
        {/* 左侧：主题编辑器 */}
        <div className={styles.editor}>
          {/* 背景颜色设置 */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <svg className={styles.icon} aria-hidden="true">
                <use xlinkHref="#icon-beijingyanse"></use>
              </svg>
              背景颜色
            </h2>

            <div className={styles.colorGrid}>
              <div className={styles.colorItem}>
                <label>主常规背景</label>
                <ColorPicker
                  value={customThemeSettings['background-color']}
                  onChange={handleColorChange('background-color')}
                  showText
                  className={styles.colorPicker}
                  size="large"
                />
              </div>

              <div className={styles.colorItem}>
                <label>次常规背景</label>
                <ColorPicker
                  value={customThemeSettings['secondary-background-color']}
                  onChange={handleColorChange('secondary-background-color')}
                  showText
                  className={styles.colorPicker}
                  size="large"
                />
              </div>

              <div className={styles.colorItem}>
                <label>悬浮背景</label>
                <ColorPicker
                  value={customThemeSettings['hover_background-color']}
                  onChange={handleColorChange('hover_background-color')}
                  showText
                  className={styles.colorPicker}
                  size="large"
                />
              </div>

              <div className={styles.colorItem}>
                <label>按下背景</label>
                <ColorPicker
                  value={customThemeSettings['focus_background-color']}
                  onChange={handleColorChange('focus_background-color')}
                  showText
                  className={styles.colorPicker}
                  size="large"
                />
              </div>
            </div>
          </div>

          {/* 字体颜色设置 */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <svg className={styles.icon} aria-hidden="true">
                <use xlinkHref="#icon-ziti"></use>
              </svg>
              字体颜色
            </h2>

            <div className={styles.colorGrid}>
              <div className={styles.colorItem}>
                <label>常规颜色</label>
                <ColorPicker
                  value={customThemeSettings['font-color']}
                  onChange={handleColorChange('font-color')}
                  showText
                  className={styles.colorPicker}
                />
              </div>

              <div className={styles.colorItem}>
                <label>次常规颜色</label>
                <ColorPicker
                  value={customThemeSettings['secondary-font-color']}
                  onChange={handleColorChange('secondary-font-color')}
                  showText
                  className={styles.colorPicker}
                />
              </div>

              <div className={styles.colorItem}>
                <label>悬浮颜色</label>
                <ColorPicker
                  value={customThemeSettings['hover_font-color']}
                  onChange={handleColorChange('hover_font-color')}
                  showText
                  className={styles.colorPicker}
                />
              </div>

              <div className={styles.colorItem}>
                <label>按下颜色</label>
                <ColorPicker
                  value={customThemeSettings['focus_font-color']}
                  onChange={handleColorChange('focus_font-color')}
                  showText
                  className={styles.colorPicker}
                />
              </div>

              <div className={styles.colorItem}>
                <label>水印颜色</label>
                <ColorPicker
                  value={customThemeSettings['watermark-font-color']}
                  onChange={handleColorChange('watermark-font-color')}
                  showText
                  className={styles.colorPicker}
                />
              </div>
            </div>
          </div>

          {/* 边框设置 */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <svg className={styles.icon} aria-hidden="true">
                <use xlinkHref="#icon-biankuangyanse"></use>
              </svg>
              边框颜色
            </h2>

            <div className={styles.colorGrid}>
              <div className={styles.colorItem}>
                <label>常规颜色</label>
                <ColorPicker
                  value={customThemeSettings['border_color']}
                  onChange={handleColorChange('border_color')}
                  showText
                  className={styles.colorPicker}
                />
              </div>

              <div className={styles.colorItem}>
                <label>次常规颜色</label>
                <ColorPicker
                  value={customThemeSettings['secondary-border_color']}
                  onChange={handleColorChange('secondary-border_color')}
                  showText
                  className={styles.colorPicker}
                />
              </div>

              <div className={styles.colorItem}>
                <label>悬浮颜色</label>
                <ColorPicker
                  value={customThemeSettings['hover_border_color']}
                  onChange={handleColorChange('hover_border_color')}
                  showText
                  className={styles.colorPicker}
                />
              </div>

              <div className={styles.colorItem}>
                <label>按下颜色</label>
                <ColorPicker
                  value={customThemeSettings['focus_border_color']}
                  onChange={handleColorChange('focus_border_color')}
                  showText
                  className={styles.colorPicker}
                />
              </div>
            </div>
          </div>

          {/* 阴影设置 */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <svg className={styles.icon} aria-hidden="true">
                <use xlinkHref="#icon-yinying"></use>
              </svg>
              阴影颜色
            </h2>

            <div className={styles.colorGrid}>
              <div className={styles.colorItem}>
                <label>常规阴影</label>
                <ColorPicker
                  value={customThemeSettings['shadow_color']}
                  onChange={handleColorChange('shadow_color')}
                  showText
                  className={styles.colorPicker}
                />
              </div>

              <div className={styles.colorItem}>
                <label>悬浮阴影</label>
                <ColorPicker
                  value={customThemeSettings['hover_shadow_color']}
                  onChange={handleColorChange('hover_shadow_color')}
                  showText
                  className={styles.colorPicker}
                />
              </div>

              <div className={styles.colorItem}>
                <label>按下阴影</label>
                <ColorPicker
                  value={customThemeSettings['focus_shadow_color']}
                  onChange={handleColorChange('focus_shadow_color')}
                  showText
                  className={styles.colorPicker}
                />
              </div>
            </div>
          </div>

          {/* 字体设置 */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <svg className={styles.icon} aria-hidden="true">
                <use xlinkHref="#icon-ziti"></use>
              </svg>
              字体设置
            </h2>

            <div className={styles.settingsGrid}>
              <div className={styles.settingItem}>
                <label>字体家族</label>
                <select
                  value={customThemeSettings['font-family']}
                  onChange={(e) => handleSettingChange('font-family', e.target.value)}
                  className={styles.select}
                >
                  <option value="system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif">系统字体</option>
                  <option value="Arial, Helvetica, sans-serif">Arial</option>
                  <option value="'Microsoft YaHei', sans-serif">微软雅黑</option>
                  <option value="'SimSun', serif">宋体</option>
                  <option value="'KaiTi', serif">楷体</option>
                  <option value="'SimHei', sans-serif">黑体</option>
                </select>
              </div>
            </div>
          </div>

          {/* 快速预设 */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <svg className={styles.icon} aria-hidden="true">
                <use xlinkHref="#icon-mofabang"></use>
              </svg>
              快速预设
            </h2>

            <div className={styles.presets}>
              <button 
                className={styles.presetBtn}
                onClick={() => applyPreset('light')}
              >
                浅色主题
              </button>
              <button 
                className={styles.presetBtn}
                onClick={() => applyPreset('dark')}
              >
                深色主题
              </button>
              <button 
                className={styles.presetBtn}
                onClick={() => applyPreset('blue')}
              >
                蓝色主题
              </button>
            </div>
          </div>

          {/* 保存主题 */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <svg className={styles.icon} aria-hidden="true">
                <use xlinkHref="#icon-baocun"></use>
              </svg>
              保存主题
            </h2>

            <div className={styles.saveSection}>
              <input
                placeholder="输入主题名称"
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
                className={styles.nameInput}
              />
              <div className={styles.saveActions}>
                {editingTheme ? (
                  <>
                    <button 
                      className={styles.btnPrimary}
                      onClick={handleSaveTheme}
                    >
                      更新主题
                    </button>
                    <button 
                      className={styles.btnOutline}
                      onClick={cancelEditing}
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <Button 
                    
                    onClick={handleSaveTheme} 
                     variant="secondary"
          size="small"
                  >
                    保存
                  </Button>

                   
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：主题列表 */}
        <div className={styles.sidebar}>
          <h3 className={styles.sidebarTitle}>
            <svg className={styles.icon} aria-hidden="true">
              <use xlinkHref="#icon-liebiao"></use>
            </svg>
            已保存的主题
          </h3>
          
          {Object.keys(customThemes).length === 0 ? (
            <div className={styles.empty}>
              <p>暂无自定义主题</p>
              <small>创建并保存您的第一个主题</small>
            </div>
          ) : (
            <div className={styles.list}>
              {Object.entries(customThemes).map(([name, themeData]) => (
                <div
                  key={name}
                  className={`${styles.item} ${currentTheme === name ? styles.itemActive : ''}`}
                >
                  <div className={styles.itemInfo}>
                    <div className={styles.itemName}>{name}</div>
                    <div className={styles.itemDate}>
                      {new Date(themeData.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={styles.itemActions}>
                    <button
                      onClick={() => applyCustomTheme(name)}
                      disabled={currentTheme === name}
                      className={`${styles.actionBtn} ${currentTheme === name ? styles.actionActive : ''}`}
                    >
                      {currentTheme === name ? '已应用' : '应用'}
                    </button>
                    <button 
                      onClick={() => startEditing(name)}
                      className={`${styles.actionBtn} ${styles.actionEdit}`}
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDeleteTheme(name)}
                      className={`${styles.actionBtn} ${styles.actionDelete}`}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemThemeSettings;
// components/ThemeSettings/SystemThemeSettings.js
import React, { useState, useEffect } from 'react';
import { ColorPicker, message } from 'antd';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext'; // 导入 AuthContext
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

// 数据库字段名到CSS变量名的映射
const DB_FIELD_TO_CSS_VAR = {
  background_color: 'background-color',
  secondary_background_color: 'secondary-background-color',
  hover_background_color: 'hover_background-color',
  focus_background_color: 'focus_background-color',
  font_color: 'font-color',
  secondary_font_color: 'secondary-font-color',
  hover_font_color: 'hover_font-color',
  focus_font_color: 'focus_font-color',
  watermark_font_color: 'watermark-font-color',
  font_family: 'font-family',
  border_color: 'border_color',
  secondary_border_color: 'secondary-border_color',
  hover_border_color: 'hover_border_color',
  focus_border_color: 'focus_border_color',
  shadow_color: 'shadow_color',
  hover_shadow_color: 'hover_shadow_color',
  focus_shadow_color: 'focus_shadow_color'
};

// 从数据库主题数据转换为CSS变量格式
const transformDbThemeToCss = (dbTheme) => {
  const cssTheme = {};
  
  Object.keys(DB_FIELD_TO_CSS_VAR).forEach(dbField => {
    const cssVar = DB_FIELD_TO_CSS_VAR[dbField];
    if (dbTheme[dbField] !== undefined && dbTheme[dbField] !== null) {
      cssTheme[cssVar] = dbTheme[dbField];
    }
  });
  
  return cssTheme;
};

// 从CSS变量格式转换为数据库字段格式
const transformCssToDbTheme = (cssTheme) => {
  const dbTheme = {};
  
  Object.keys(DB_FIELD_TO_CSS_VAR).forEach(dbField => {
    const cssVar = DB_FIELD_TO_CSS_VAR[dbField];
    if (cssTheme[cssVar] !== undefined) {
      dbTheme[dbField] = cssTheme[cssVar];
    }
  });
  
  return dbTheme;
};

const SystemThemeSettings = () => {
  const {
    currentTheme,
    customThemes,
    previewTheme,
    themeSettings, // 从 ThemeContext 获取当前主题设置
    userDefaultTheme, // 用户数据库主题
    updateDefaultTheme, // 更新默认主题到数据库
    saveCustomTheme,
    applyCustomTheme,
    deleteCustomTheme,
    updateCustomTheme,
    previewThemeSettings,
    cancelPreview,
    resetToDefault,
    loading: themeLoading
  } = useTheme();

  const { user, userTheme, refreshTheme } = useAuth(); // 从 AuthContext 获取用户和主题

  const [themeName, setThemeName] = useState('');
  const [editingTheme, setEditingTheme] = useState(null);
  const [customThemeSettings, setCustomThemeSettings] = useState({});
  const [loading, setLoading] = useState(true);

  // 初始化设置 - 使用从数据库获取的用户主题
  useEffect(() => {
    const initializeThemeSettings = async () => {
      setLoading(true);
      
      try {
        // 如果有编辑中的主题，使用编辑主题
        if (editingTheme && customThemes[editingTheme]) {
          const themeData = customThemes[editingTheme];
          setCustomThemeSettings(themeData);
          setThemeName(editingTheme);
          previewThemeSettings(themeData);
        } 
        // 如果用户有数据库主题，优先使用数据库主题
        else if (userTheme) {
          console.log('使用数据库用户主题:', userTheme);
          const cssTheme = transformDbThemeToCss(userTheme);
          setCustomThemeSettings(cssTheme);
          setThemeName('');
          setEditingTheme(null);
          previewThemeSettings(cssTheme);
        }
        // 否则使用当前主题设置
        else if (currentTheme === 'default') {
          console.log('使用默认主题设置:', themeSettings);
          setCustomThemeSettings(themeSettings);
          setThemeName('');
          setEditingTheme(null);
        } else {
          // 使用当前应用的自定义主题
          const currentThemeData = customThemes[currentTheme];
          if (currentThemeData) {
            setCustomThemeSettings(currentThemeData);
            setThemeName(currentTheme);
          } else {
            // 回退到默认主题设置
            setCustomThemeSettings(themeSettings);
            setThemeName('');
          }
        }
      } catch (error) {
        console.error('初始化主题设置失败:', error);
        // 使用后备主题设置
        setCustomThemeSettings(themeSettings);
      } finally {
        setLoading(false);
      }
    };

    initializeThemeSettings();
  }, [editingTheme, customThemes, currentTheme, themeSettings, userTheme]);

  // 实时预览主题变化
  useEffect(() => {
    if (Object.keys(customThemeSettings).length > 0) {
      previewThemeSettings(customThemeSettings);
    }
  }, [customThemeSettings]);

  // 处理颜色变化
  const handleColorChange = (key) => (color) => {
    const hex8Digit = get8DigitHexFromColor(color);
    setCustomThemeSettings(prev => ({
      ...prev,
      [key]: hex8Digit
    }));
  };

  const handleSaveTheme = async () => {
    if (!themeName.trim()) {
      message.error('请输入主题名称');
      return;
    }

    if (customThemes[themeName] && !editingTheme) {
      message.error('主题名称已存在');
      return;
    }

    if (editingTheme) {
      // 更新自定义主题
      updateCustomTheme(editingTheme, customThemeSettings);
      setEditingTheme(null);
      message.success('主题更新成功！');
    } else {
      // 保存新自定义主题
      saveCustomTheme(themeName, customThemeSettings);
      message.success('主题保存成功！');
    }
    
    setThemeName('');
  };

  // 保存为默认主题（更新数据库）
  const handleSaveAsDefault = async () => {
    try {
      if (!user) {
        message.error('用户未登录');
        return;
      }

      const dbTheme = transformCssToDbTheme(customThemeSettings);
      const themeData = {
        username: user.username,
        email: user.email,
        theme_name: '默认主题',
        ...dbTheme
      };

      // 使用 apiClient 直接调用 API
      const response = await fetch('http://111.231.79.183:4200/api/UserThemeSettings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(themeData)
      });

      const result = await response.json();

      if (result.success) {
        message.success('默认主题更新成功！');
        // 刷新主题
        if (refreshTheme) {
          await refreshTheme();
        }
      } else {
        message.error(result.message || '更新默认主题失败');
      }
    } catch (error) {
      console.error('保存默认主题失败:', error);
      message.error('保存默认主题失败');
    }
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

  if (themeLoading || loading) {
    return <div className={styles.loading}>加载主题设置中...</div>;
  }

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
          {userTheme && <span className={styles.dbBadge}>数据库主题</span>}
        </h1>
        <div className={styles.current}>
          <span className={styles.currentLabel}>当前主题:</span>
          <span className={styles.currentName}>
            {currentTheme === 'default' ? '默认主题' : currentTheme}
            {userTheme && currentTheme === 'default' && ' (数据库)'}
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
                  <>
                    <Button 
                      onClick={handleSaveTheme} 
                      variant="secondary"
                      size="small"
                    >
                      保存为自定义主题
                    </Button>
                    {currentTheme === 'default' && user && (
                      <Button 
                        onClick={handleSaveAsDefault}
                        variant="primary"
                        size="small"
                      >
                        更新默认主题
                      </Button>
                    )}
                  </>
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
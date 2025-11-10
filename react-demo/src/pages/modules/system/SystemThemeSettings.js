// components/ThemeSettings/SystemThemeSettings.js
// src/components/ThemeSettings/SystemThemeSettings.js
import React, { useState, useEffect, useCallback } from 'react';
import { ColorPicker, message } from 'antd';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
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
  if (color && typeof color.toHexString === 'function') return ensure8DigitHex(color.toHexString());
  if (typeof color === 'string') return ensure8DigitHex(color);
  return '#FFFFFFFF';
};

const SystemThemeSettings = () => {
  const {
    allThemes,
    activeTheme,
    defaultTheme,
    loading: themeLoading,
    fetchUserThemes,
    setActiveThemeById,
    setDefaultThemeById,
    createNewTheme,
    updateThemeById,
    deleteThemeById,
    previewThemeSettings,
    cancelPreview,
    transformDbThemeToCss,
    transformCssToDbTheme
  } = useTheme();

  const { user, isAuthenticated } = useAuth();

  const userThemes = allThemes.filter(theme => 
    theme.email === user?.email && theme.username === user?.username
  );

  const [editingTheme, setEditingTheme] = useState(null);
  const [newThemeName, setNewThemeName] = useState('');
  const [customThemeSettings, setCustomThemeSettings] = useState(() => 
    activeTheme ? transformDbThemeToCss(activeTheme) : { ...defaultTheme }
  );
  const [saving, setSaving] = useState(false);
  const [creatingNew, setCreatingNew] = useState(false);

  // 监听活动主题变化，当切换主题或取消编辑时，重置颜色选择器
  useEffect(() => {
    if (activeTheme && !editingTheme && !creatingNew) {
      setCustomThemeSettings(transformDbThemeToCss(activeTheme));
    } else if (!activeTheme && !editingTheme && !creatingNew) {
      setCustomThemeSettings({ ...defaultTheme });
    }
  }, [activeTheme, editingTheme, creatingNew, transformDbThemeToCss, defaultTheme]);

  // 实时预览
  useEffect(() => {
    if ((editingTheme || creatingNew) && Object.keys(customThemeSettings).length > 0) {
      const timer = setTimeout(() => {
        previewThemeSettings(customThemeSettings);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [customThemeSettings, editingTheme, creatingNew, previewThemeSettings]);

  const handleColorChange = useCallback((key) => (color) => {
    setCustomThemeSettings(prev => ({ ...prev, [key]: get8DigitHexFromColor(color) }));
  }, []);

  const handleApplyTheme = useCallback(async (themeId) => {
    try {
      await setActiveThemeById(themeId);
      message.success('主题应用成功！');
    } catch (error) {
      message.error(error.message || '应用主题失败');
    }
  }, [setActiveThemeById]);
  
  const handleSetDefaultTheme = useCallback(async (themeId) => {
    try {
      await setDefaultThemeById(themeId);
      message.success('已设为个人默认主题！');
    } catch (error) {
      message.error(error.message || '设置默认主题失败');
    }
  }, [setDefaultThemeById]);

  const startEditing = useCallback((themeId) => {
    const themeToEdit = userThemes.find(t => t.id === themeId);
    if (themeToEdit) {
      setEditingTheme(themeId);
      setCreatingNew(false);
      setNewThemeName(themeToEdit.theme_name);
      setCustomThemeSettings(transformDbThemeToCss(themeToEdit));
    }
  }, [userThemes, transformDbThemeToCss]);

  const cancelEditingAndCreating = useCallback(() => {
    setEditingTheme(null);
    setCreatingNew(false);
    setNewThemeName('');
    cancelPreview();
  }, [cancelPreview]);

  const handleSaveEdit = useCallback(async () => {
    if (!editingTheme || !newThemeName.trim()) {
      message.error('请输入主题名称'); return;
    }
    setSaving(true);
    try {
      const dbTheme = transformCssToDbTheme(customThemeSettings);
      await updateThemeById(editingTheme, { ...dbTheme, theme_name: newThemeName });
      message.success('主题更新成功！');
      cancelEditingAndCreating();
    } catch (error) {
      message.error(error.message || '更新主题失败');
    } finally {
      setSaving(false);
    }
  }, [editingTheme, newThemeName, customThemeSettings, updateThemeById, transformCssToDbTheme, cancelEditingAndCreating]);
  
  const handleCreateNewTheme = useCallback(() => {
    if (!isAuthenticated) { message.error('请先登录'); return; }
    setCreatingNew(true);
    setEditingTheme(null);
    setNewThemeName('新主题');
    setCustomThemeSettings({ ...defaultTheme });
  }, [isAuthenticated, defaultTheme]);

  const handleSaveNewTheme = useCallback(async () => {
    if (!newThemeName.trim()) { message.error('请输入主题名称'); return; }
    if (!isAuthenticated) { message.error('请先登录'); return; }

    setSaving(true);
    try {
      await createNewTheme(newThemeName, customThemeSettings, false);
      message.success('主题创建成功！');
      cancelEditingAndCreating();
    } catch (error) {
      message.error(error.message || '创建主题失败');
    } finally {
      setSaving(false);
    }
  }, [newThemeName, isAuthenticated, customThemeSettings, createNewTheme, cancelEditingAndCreating]);

  const handleDeleteTheme = useCallback(async (themeId, themeName) => {
    if (window.confirm(`确定删除主题 "${themeName}" 吗？`)) {
      try {
        await deleteThemeById(themeId);
        message.success('主题删除成功！');
      } catch (error) {
        message.error(error.message || '删除主题失败');
      }
    }
  }, [deleteThemeById]);

  const handleRefreshThemes = useCallback(async () => {
    try {
      await fetchUserThemes();
      message.success('主题列表已刷新');
    } catch (error) {
      message.error('刷新主题列表失败');
    }
  }, [fetchUserThemes]);

  const applyPreset = useCallback((presetName) => {
    const presets = {
      light: { 'background-color': '#FFFFFFFF', 'secondary-background-color': '#F8F9FAFF', 'hover_background-color': '#E9ECEEFF', 'focus_background-color': '#DEE2E6FF', 'font-color': '#000000FF', 'secondary-font-color': '#6C757DFF', 'hover_font-color': '#0078D4FF', 'focus_font-color': '#0056B3FF', 'watermark-font-color': '#B3B5B6FF', 'border_color': '#DEE2E6FF', 'secondary-border_color': '#E9ECEEFF', 'hover_border_color': '#0078D4FF', 'focus_border_color': '#0056B3FF', 'shadow_color': '#00000019', 'hover_shadow_color': '#00000026', 'focus_shadow_color': '#0078D440' },
      dark: { 'background-color': '#1A1A1AFF', 'secondary-background-color': '#2D2D2DFF', 'hover_background-color': '#3D3D3DFF', 'focus_background-color': '#4D4D4DFF', 'font-color': '#FFFFFFFF', 'secondary-font-color': '#B3B3B3FF', 'hover_font-color': '#0078D4FF', 'focus_font-color': '#0056B3FF', 'watermark-font-color': '#666666FF', 'border_color': '#495057FF', 'secondary-border_color': '#5A6268FF', 'hover_border_color': '#0078D4FF', 'focus_border_color': '#0056B3FF', 'shadow_color': '#00000080', 'hover_shadow_color': '#00000099', 'focus_shadow_color': '#0078D440' },
      blue: { 'background-color': '#F0F8FFFF', 'secondary-background-color': '#E6F2FFFF', 'hover_background-color': '#D4EBFFFF', 'focus_background-color': '#C2E4FFFF', 'font-color': '#003366FF', 'secondary-font-color': '#0066CCFF', 'hover_font-color': '#004499FF', 'focus_font-color': '#002244FF', 'watermark-font-color': '#99CCFFFF', 'border_color': '#B3D9FFFF', 'secondary-border_color': '#99CCFFFF', 'hover_border_color': '#0066CCFF', 'focus_border_color': '#004499FF', 'shadow_color': '#0066CC26', 'hover_shadow_color': '#0066CC40', 'focus_shadow_color': '#0066CC66' }
    };
    if (presets[presetName]) {
      setCustomThemeSettings(prev => ({ ...prev, ...presets[presetName] }));
      message.info(`已应用 ${presetName} 预设`);
    }
  }, []);

  const handleSettingChange = useCallback((key, value) => {
    setCustomThemeSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  if (themeLoading) {
    return <div className={styles.loading}>加载主题设置中...</div>;
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* 左侧：主题编辑器 */}
        <div className={styles.editor}>
          {/* 背景颜色设置 */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <svg className={styles.icon} aria-hidden="true"><use xlinkHref="#icon-beijingyanse"></use></svg>
              背景颜色
            </h2>
            <div className={styles.colorGrid}>
              <div className={styles.colorItem}><label>主常规背景</label><ColorPicker value={customThemeSettings['background-color']} onChange={handleColorChange('background-color')} showText className={styles.colorPicker} size="large" /></div>
              <div className={styles.colorItem}><label>次常规背景</label><ColorPicker value={customThemeSettings['secondary-background-color']} onChange={handleColorChange('secondary-background-color')} showText className={styles.colorPicker} size="large" /></div>
              <div className={styles.colorItem}><label>悬浮背景</label><ColorPicker value={customThemeSettings['hover_background-color']} onChange={handleColorChange('hover_background-color')} showText className={styles.colorPicker} size="large" /></div>
              <div className={styles.colorItem}><label>按下背景</label><ColorPicker value={customThemeSettings['focus_background-color']} onChange={handleColorChange('focus_background-color')} showText className={styles.colorPicker} size="large" /></div>
            </div>
          </div>

          {/* 字体颜色设置 */}
          <div className={styles.section}>
             <h2 className={styles.sectionTitle}><svg className={styles.icon} aria-hidden="true"><use xlinkHref="#icon-ziti"></use></svg>字体颜色</h2>
            <div className={styles.colorGrid}>
              <div className={styles.colorItem}><label>常规颜色</label><ColorPicker value={customThemeSettings['font-color']} onChange={handleColorChange('font-color')} showText className={styles.colorPicker} /></div>
              <div className={styles.colorItem}><label>次常规颜色</label><ColorPicker value={customThemeSettings['secondary-font-color']} onChange={handleColorChange('secondary-font-color')} showText className={styles.colorPicker} /></div>
              <div className={styles.colorItem}><label>悬浮颜色</label><ColorPicker value={customThemeSettings['hover_font-color']} onChange={handleColorChange('hover_font-color')} showText className={styles.colorPicker} /></div>
              <div className={styles.colorItem}><label>按下颜色</label><ColorPicker value={customThemeSettings['focus_font-color']} onChange={handleColorChange('focus_font-color')} showText className={styles.colorPicker} /></div>
              <div className={styles.colorItem}><label>水印颜色</label><ColorPicker value={customThemeSettings['watermark-font-color']} onChange={handleColorChange('watermark-font-color')} showText className={styles.colorPicker} /></div>
            </div>
          </div>

          {/* 边框颜色设置 */}
          <div className={styles.section}>
             <h2 className={styles.sectionTitle}><svg className={styles.icon} aria-hidden="true"><use xlinkHref="#icon-biankuangyanse"></use></svg>边框颜色</h2>
            <div className={styles.colorGrid}>
              <div className={styles.colorItem}><label>常规颜色</label><ColorPicker value={customThemeSettings['border_color']} onChange={handleColorChange('border_color')} showText className={styles.colorPicker} /></div>
              <div className={styles.colorItem}><label>次常规颜色</label><ColorPicker value={customThemeSettings['secondary-border_color']} onChange={handleColorChange('secondary-border_color')} showText className={styles.colorPicker} /></div>
              <div className={styles.colorItem}><label>悬浮颜色</label><ColorPicker value={customThemeSettings['hover_border_color']} onChange={handleColorChange('hover_border_color')} showText className={styles.colorPicker} /></div>
              <div className={styles.colorItem}><label>按下颜色</label><ColorPicker value={customThemeSettings['focus_border_color']} onChange={handleColorChange('focus_border_color')} showText className={styles.colorPicker} /></div>
            </div>
          </div>

          {/* 阴影颜色设置 */}
          <div className={styles.section}>
             <h2 className={styles.sectionTitle}><svg className={styles.icon} aria-hidden="true"><use xlinkHref="#icon-yinying"></use></svg>阴影颜色</h2>
            <div className={styles.colorGrid}>
              <div className={styles.colorItem}><label>常规阴影</label><ColorPicker value={customThemeSettings['shadow_color']} onChange={handleColorChange('shadow_color')} showText className={styles.colorPicker} /></div>
              <div className={styles.colorItem}><label>悬浮阴影</label><ColorPicker value={customThemeSettings['hover_shadow_color']} onChange={handleColorChange('hover_shadow_color')} showText className={styles.colorPicker} /></div>
              <div className={styles.colorItem}><label>按下阴影</label><ColorPicker value={customThemeSettings['focus_shadow_color']} onChange={handleColorChange('focus_shadow_color')} showText className={styles.colorPicker} /></div>
            </div>
          </div>

          {/* 字体设置 */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}><svg className={styles.icon} aria-hidden="true"><use xlinkHref="#icon-ziti"></use></svg>字体设置</h2>
            <div className={styles.settingsGrid}>
              <div className={styles.settingItem}>
                <label>字体家族</label>
                <select value={customThemeSettings['font-family']} onChange={(e) => handleSettingChange('font-family', e.target.value)} className={styles.select}>
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
            <h2 className={styles.sectionTitle}><svg className={styles.icon} aria-hidden="true"><use xlinkHref="#icon-mofabang"></use></svg>快速预设</h2>
            <div className={styles.presets}>
              <Button onClick={() => applyPreset('light')} variant="secondary" size="small">浅色主题</Button>
              <Button onClick={() => applyPreset('dark')} variant="secondary" size="small">深色主题</Button>
              <Button onClick={() => applyPreset('blue')} variant="secondary" size="small">蓝色主题</Button>
            </div>
          </div>
        </div>
        
        {/* 右侧：主题列表 */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3 className={styles.sidebarTitle}><svg className={styles.icon} aria-hidden="true"><use xlinkHref="#icon-liebiao"></use></svg>我的主题 ({userThemes.length})</h3>
            <div className={styles.sidebarActions}>
              <Button onClick={handleRefreshThemes} variant="secondary" size="small" loading={themeLoading}>刷新列表</Button>
              <Button onClick={handleCreateNewTheme} variant="primary" size="small">新建主题</Button>
            </div>
          </div>

          {!isAuthenticated && (<div className={styles.loginTip}>请登录后管理主题</div>)}

          {userThemes.length === 0 && isAuthenticated ? (
            <div className={styles.empty}><p>暂无主题</p><small>创建您的第一个主题</small></div>
          ) : (
            <div className={styles.list}>
              {creatingNew && (
                <div className={`${styles.item} ${styles.creatingItem}`}>
                  <div className={styles.itemInfo}><input type="text" value={newThemeName} onChange={(e) => setNewThemeName(e.target.value)} className={styles.nameInput} placeholder="输入主题名称" /></div>
                  <div className={styles.itemActions}>
                    <Button onClick={handleSaveNewTheme} variant="primary" size="small" loading={saving} disabled={!newThemeName.trim()}>保存</Button>
                    <Button onClick={cancelEditingAndCreating} variant="secondary" size="small">取消</Button>
                  </div>
                </div>
              )}

              {userThemes.map((theme) => {
                const isActive = activeTheme?.id === theme.id;
                const isDefault = theme.is_default;

                return (
                  <div key={theme.id} className={`${styles.item} ${isActive ? styles.itemActive : ''}`}>
                    <div className={styles.itemInfo}>
                      {editingTheme === theme.id ? (
                        <input type="text" value={newThemeName} onChange={(e) => setNewThemeName(e.target.value)} className={styles.nameInput} />
                      ) : (
                        <div className={styles.itemName}>
                          {theme.theme_name}
                          {/* {isActive && <span className={styles.activeBadge}>活动</span>} */}
                          {/* {isDefault && !isActive && <span className={styles.defaultBadge}>默认</span>} */}
                        </div>
                      )}
                      {/* <div className={styles.itemDate}>
                        {(theme.created_at || theme.updated_at) ? new Date(theme.created_at || theme.updated_at).toLocaleDateString() : '...'}
                      </div> */}
                    </div>
                    <div className={styles.itemActions}>
                      {editingTheme === theme.id ? (
                        <>
                          <Button onClick={handleSaveEdit} variant="primary" size="small" loading={saving} disabled={!newThemeName.trim()}>保存</Button>
                          <Button onClick={cancelEditingAndCreating} variant="secondary" size="small">取消</Button>
                        </>
                      ) : (
                        <>
                          <Button onClick={() => handleApplyTheme(theme.id)} disabled={isActive} size="small">{isActive ? '已应用' : '应用'}</Button>
                          {/* <Button onClick={() => handleSetDefaultTheme(theme.id)} disabled={isDefault} variant="secondary" size="small">{isDefault ? '默认主题' : '设为默认'}</Button> */}
                          <Button onClick={() => startEditing(theme.id)} variant="secondary" size="small">编辑</Button>
                          <Button onClick={() => handleDeleteTheme(theme.id, theme.theme_name)} variant="secondary" size="small" disabled={isActive && userThemes.length === 1}>删除</Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemThemeSettings;
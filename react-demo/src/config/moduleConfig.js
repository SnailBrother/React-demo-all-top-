// src/config/moduleConfig.js

export const moduleConfig = {
  accounting: {
    label: '记账',
    defaultRoute: 'overview',
    routes: [
      { key: 'overview', label: '首页', icon: '#icon-shouye3', component: () => import('../pages/modules/accounting/AccountingHomePage'), showInTabs: false },
      { key: 'AccountingDetails', label: '明细', icon: '#icon-shouruzhengmingshenqingdan', component: () => import('../pages/modules/accounting/AccountingDetails'), showInTabs: false },
       { key: 'AccountingAdd', label: '添加', icon: '#icon-tianjia5', component: () => import('../pages/modules/accounting/AccountingAdd'), showInTabs: false },
      { key: 'AccountingCharts', label: '图标', icon: '#icon-baobiao', component: () => import('../pages/modules/accounting/AccountingCharts'), showInTabs: false },  
      { key: 'AccountingMy', label: '我的', icon: '#icon-drxx88', component: () => import('../pages/modules/accounting/AccountingMy'), showInTabs: false },
    ]
  },
  music: {
    label: '音乐',
    defaultRoute: 'home',
    routes: [
      { key: 'home', label: '首页', icon: '#icon-biaoqianA01_shouye-51', component: () => import('../pages/modules/music/Home'), showInTabs: false },
      { key: 'recommend', label: '推荐', icon: '#icon-tuijian1', component: () => import('../pages/modules/music/Recommend'), showInTabs: false },
      { key: 'recent', label: '最近播放', icon: '#icon-zuijinbofang', component: () => import('../pages/modules/music/Recent'), showInTabs: false },
      { key: 'favorites', label: '我的喜欢', icon: '#icon-xihuan11', component: () => import('../pages/modules/music/Favorites'), showInTabs: false },
      { key: 'musictogetherroommanager', label: '一起听歌', icon: '#icon-kefu', component: () => import('../pages/modules/music/TogetherRoomManager'), showInTabs: false },
      // 可选：其他非菜单页（如歌词页）可单独列出但不加入 routes 数组，或加 flag
    ]
  },
  outfit: {
    label: '穿搭',
    defaultRoute: 'closet',
    routes: [
      { key: 'previewwardrobe', label: '查看', icon: 'icon-guge', component: () => import('../pages/modules/outfit/PreviewWardrobe') },
      { key: 'updatewardrobe', label: '更新', icon: 'icon-guge', component: () => import('../pages/modules/outfit/UpdateWardrobe') },
      { key: 'closet', label: '衣橱', icon: 'icon-guge', component: () => import('../pages/modules/outfit/Closet') },
      { key: 'combos', label: '搭配', icon: 'icon-guge', component: () => import('../pages/modules/outfit/Combos') },
    ]
  },
  office: {
    label: '办公',
    defaultRoute: 'dashboard',
    routes: [
      { key: 'dashboard', label: '面板', icon: 'icon-guge', component: () => import('../pages/modules/office/Dashboard') },
      { key: 'docs', label: '文档', icon: 'icon-guge', component: () => import('../pages/modules/office/Docs') },
      { key: 'tasks', label: '任务', icon: 'icon-guge', component: () => import('../pages/modules/office/Tasks') },
    ]
  },
  chat: {
    label: '聊天',
    defaultRoute: 'conversations',
    routes: [
      { key: 'conversations', label: '聊天', icon: '#icon-liaotian12', component: () => import('../pages/modules/chat/Chat'), showInTabs: false },
      { key: 'contacts', label: '动态', icon: '#icon-dongtai', component: () => import('../pages/modules/chat/DressingGuidelines'), showInTabs: false },
    ]
  },
  system: {
    label: '系统',
    defaultRoute: 'theme',
    routes: [
      { key: 'theme', label: '主题设置', icon: 'icon-guge', component: () => import('../pages/modules/system/SystemThemeSettings') },
      { key: 'profile', label: '个人资料', icon: 'icon-guge', component: () => import('../pages/modules/system/Profile') },
    ]
  }
};

// 导出用于 ModuleLayout 的菜单数据（扁平化）
export const getModuleMenu = (moduleKey) => {
  return moduleConfig[moduleKey]?.routes.map(route => ({
    key: route.key,
    label: route.label,
    icon: route.icon,
    path: `/app/${moduleKey}/${route.key}`,
    showInTabs: route.showInTabs
  })) || [];
};

// 导出所有模块键
export const MODULE_KEYS = Object.keys(moduleConfig);
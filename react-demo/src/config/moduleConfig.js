// src/config/moduleConfig.js
import React, { lazy } from 'react';

// 核心页面 - 直接导入（常用页面）
import AccountingHomePage from '../pages/modules/accounting/AccountingHomePage';
import AccountingDetails from '../pages/modules/accounting/AccountingDetails';
import MusicHome from '../pages/modules/music/Home';
import MusicRecommend from '../pages/modules/music/Recommend';
import ChatChat from '../pages/modules/chat/Chat';
import Musicplayer from '../pages/modules/music/Player';
 
// 非核心页面 - 懒加载（不常用页面）
const AccountingAdd = lazy(() => import('../pages/modules/accounting/AccountingAdd'));
const AccountingCharts = lazy(() => import('../pages/modules/accounting/AccountingCharts'));
const AccountingMy = lazy(() => import('../pages/modules/accounting/AccountingMy'));
const MusicRecent = lazy(() => import('../pages/modules/music/Recent'));
const MusicFavorites = lazy(() => import('../pages/modules/music/Favorites'));
const MusicTogetherRoomManager = lazy(() => import('../pages/modules/music/TogetherRoomManager'));

const OutfitPreviewWardrobe = lazy(() => import('../pages/modules/outfit/PreviewWardrobe'));
const OutfitUpdateWardrobe = lazy(() => import('../pages/modules/outfit/UpdateWardrobe'));
const OutfitCloset = lazy(() => import('../pages/modules/outfit/Closet'));
const OutfitCombos = lazy(() => import('../pages/modules/outfit/Combos'));
const OfficeDashboard = lazy(() => import('../pages/modules/office/Dashboard'));
const OfficeDocs = lazy(() => import('../pages/modules/office/Docs'));
const OfficeTasks = lazy(() => import('../pages/modules/office/Tasks'));
const ChatDressingGuidelines = lazy(() => import('../pages/modules/chat/DressingGuidelines'));
const ChatUpdateWear = lazy(() => import('../pages/modules/chat/UpdateWear'));
const SystemThemeSettings = lazy(() => import('../pages/modules/system/SystemThemeSettings'));
const SystemProfile = lazy(() => import('../pages/modules/system/Profile'));
const FirstTimeTravel = lazy(() => import('../pages/modules/travel/FirstTime/HomeContainer'));
const SecondTimeTravel = lazy(() => import('../pages/modules/travel/SecondTime/DetailsHomeContainer'));
const TravelManager = lazy(() => import('../pages/modules/travel/TravelManager'));
 
// 隐藏页面 - 不显示在导航中
const MusicplayerLyrics = lazy(() => import('../pages/modules/music/MusicplayerLyrics'));
const MusicPlaylist = lazy(() => import('../pages/modules/music/MusicPlaylist'));
const MusicSongReview = lazy(() => import('../pages/modules/music/SongReview'));
 
export const moduleConfig = {
  accounting: {
    label: '记账',
    defaultRoute: 'AccountingHomePage',
    routes: [
      { key: 'AccountingHomePage', label: '首页', icon: '#icon-shouye3', component: AccountingHomePage, showInTabs: false, showInNavigation: true },
      { key: 'AccountingDetails', label: '明细', icon: '#icon-shouruzhengmingshenqingdan', component: AccountingDetails, showInTabs: false, showInNavigation: true },
      { key: 'AccountingAdd', label: '添加', icon: '#icon-tianjia5', component: AccountingAdd, showInTabs: false, showInNavigation: true },
      { key: 'AccountingCharts', label: '图表', icon: '#icon-baobiao', component: AccountingCharts, showInTabs: false, showInNavigation: true },  
      { key: 'AccountingMy', label: '我的', icon: '#icon-drxx88', component: AccountingMy, showInTabs: false, showInNavigation: true },
    ]
  },
  music: {
    label: '音乐',
    defaultRoute: 'home',
    routes: [
      { key: 'home', label: '首页', icon: '#icon-biaoqianA01_shouye-51', component: MusicHome, showInTabs: false, showInNavigation: true },
      { key: 'recommend', label: '推荐', icon: '#icon-tuijian1', component: MusicRecommend, showInTabs: false, showInNavigation: true },
      { key: 'recent', label: '最近播放', icon: '#icon-zuijinbofang', component: MusicRecent, showInTabs: false, showInNavigation: true },
      { key: 'favorites', label: '我的喜欢', icon: '#icon-xihuan11', component: MusicFavorites, showInTabs: false, showInNavigation: true },
      { key: 'musictogetherroommanager', label: '一起听歌', icon: '#icon-kefu', component: MusicTogetherRoomManager, showInTabs: false, showInNavigation: true },
      // 隐藏的路由 - 不显示在导航中
      { key: 'musicplayerlyrics', label: '歌词', component: MusicplayerLyrics, showInTabs: false, showInNavigation: false },
      { key: 'musicplayer', label: '播放器', component: Musicplayer, showInTabs: false, showInNavigation: false },
      { key: 'musicplaylist', label: '播放列表', component: MusicPlaylist, showInTabs: false, showInNavigation: false },
     { key: 'musicsongreview', label: '播放列表', component: MusicSongReview, showInTabs: false, showInNavigation: false },
       
    ]
  },
  outfit: {
    label: '穿搭',
    defaultRoute: 'closet',
    routes: [
      { key: 'previewwardrobe', label: '查看', icon: 'icon-guge', component: OutfitPreviewWardrobe, showInNavigation: true },
      { key: 'updatewardrobe', label: '更新', icon: 'icon-guge', component: OutfitUpdateWardrobe, showInNavigation: true },
      { key: 'closet', label: '衣橱', icon: 'icon-guge', component: OutfitCloset, showInNavigation: true },
      { key: 'combos', label: '搭配', icon: 'icon-guge', component: OutfitCombos, showInNavigation: true },
    ]
  },
  office: {
    label: '办公',
    defaultRoute: 'dashboard',
    routes: [
      { key: 'dashboard', label: '面板', icon: 'icon-guge', component: OfficeDashboard, showInNavigation: true },
      { key: 'docs', label: '文档', icon: 'icon-guge', component: OfficeDocs, showInNavigation: true },
      { key: 'tasks', label: '任务', icon: 'icon-guge', component: OfficeTasks, showInNavigation: true },
    ]
  },
  chat: {
    label: '聊天',
    defaultRoute: 'ChatChat',
    routes: [
      { key: 'ChatChat', label: '聊天', icon: '#icon-liaotian12', component: ChatChat, showInTabs: false, showInNavigation: true },
      { key: 'ChatDressingGuidelines', label: '动态', icon: '#icon-dongtai', component: ChatDressingGuidelines, showInTabs: false, showInNavigation: true },
      { key: 'ChatUpdateWear', label: '发布', icon: '#icon-logo2', component: ChatUpdateWear, showInTabs: false, showInNavigation: true },
    ]
  },
  travelmanager: {
    label: '旅行',
    defaultRoute: 'TravelManager',
    routes: [
       { key: 'TravelManager', label: '美好时光', icon: '#icon-icon-test-copy', component: TravelManager, showInTabs: false, showInNavigation: true }, 
      { key: 'FirstTimeTravel', label: '第一卷', icon: '#icon-lvhang', component: FirstTimeTravel, showInTabs: false, showInNavigation: false },
      { key: 'SecondTimeTravel', label: '第二卷', icon: '#icon-icon-test-copy', component: SecondTimeTravel, showInTabs: false, showInNavigation: false }, 
    ]
  },
  system: {
    label: '系统',
    defaultRoute: 'theme',
    routes: [
      { key: 'theme', label: '主题设置', icon: '#icon-zhuti1', component: SystemThemeSettings, showInNavigation: true },
      { key: 'profile', label: '个人资料', icon: '#icon-user-01', component: SystemProfile, showInNavigation: true },
    ]
  }
};

// 导出用于 ModuleLayout 的菜单数据 - 只包含 showInNavigation 为 true 的路由
export const getModuleMenu = (moduleKey) => {
  return moduleConfig[moduleKey]?.routes
    .filter(route => route.showInNavigation !== false) // 只包含显示在导航中的路由
    .map(route => ({
      key: route.key,
      label: route.label,
      icon: route.icon,
      path: `/app/${moduleKey}/${route.key}`,
      showInTabs: route.showInTabs !== undefined ? route.showInTabs : true
    })) || [];
};

// 导出所有模块键
export const MODULE_KEYS = Object.keys(moduleConfig);
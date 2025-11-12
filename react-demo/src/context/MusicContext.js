// src/context/MusicContext.js 创建音乐上下文管理播放器状态
// src/context/MusicContext.js
import React, { createContext, useContext, useReducer } from 'react';

const MusicContext = createContext();

// 初始状态 - 添加 progress
const initialState = {
  currentSong: null,
  isPlaying: false,
  volume: 1,
  queue: [],
  currentIndex: -1,
  progress: 0, // 添加播放进度
  duration: 0, // 添加总时长
};

// Reducer - 添加进度更新
function musicReducer(state, action) {
  switch (action.type) {
    case 'PLAY_SONG':
      return {
        ...state,
        currentSong: action.payload.song,
        queue: action.payload.queue,
        currentIndex: action.payload.index,
        isPlaying: true,
        progress: 0, // 重置进度
      };
    case 'TOGGLE_PLAY':
      if (!state.currentSong) return state;
      return {
        ...state,
        isPlaying: !state.isPlaying,
      };
    case 'NEXT_SONG':
      if (state.queue.length === 0) return state;
      const nextIndex = (state.currentIndex + 1) % state.queue.length;
      return {
        ...state,
        currentIndex: nextIndex,
        currentSong: state.queue[nextIndex],
        isPlaying: true,
        progress: 0, // 重置进度
      };
    case 'PREV_SONG':
      if (state.queue.length === 0) return state;
      const prevIndex = (state.currentIndex - 1 + state.queue.length) % state.queue.length;
      return {
        ...state,
        currentIndex: prevIndex,
        currentSong: state.queue[prevIndex],
        isPlaying: true,
        progress: 0, // 重置进度
      };
    case 'SET_PROGRESS': // 新增：设置播放进度
      return {
        ...state,
        progress: action.payload,
      };
    case 'SET_DURATION': // 新增：设置总时长
      return {
        ...state,
        duration: action.payload,
      };
    default:
      return state;
  }
}

// Provider组件
export const MusicProvider = ({ children }) => {
  const [state, dispatch] = useReducer(musicReducer, initialState);

  return (
    <MusicContext.Provider value={{ state, dispatch }}>
      {children}
    </MusicContext.Provider>
  );
};

// Hook
export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};

export default MusicContext;
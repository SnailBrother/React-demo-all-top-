// src/context/MusicContext.js 创建音乐上下文管理播放器状态
import React, { createContext, useContext, useReducer } from 'react';

const MusicContext = createContext();

// 初始状态
const initialState = {
  currentSong: {
    title: '未播放',
    artist: '选择一首歌曲开始播放',
    duration: 0,
    cover: '🎵'
  },
  isPlaying: false,
  progress: 0,
  volume: 100,
  queue: [],
  currentIndex: -1,
  showPlayer: true, // 新增控制播放器显示的状态
};

// Reducer
function musicReducer(state, action) {
  switch (action.type) {
    case 'SET_CURRENT_SONG':
      return {
        ...state,
        currentSong: action.payload,
        isPlaying: true,
        currentIndex: action.index || 0,
      };
    case 'TOGGLE_PLAY':
      return {
        ...state,
        isPlaying: !state.isPlaying,
      };
    case 'SET_PROGRESS':
      return {
        ...state,
        progress: action.payload,
      };
    case 'SET_QUEUE':
      return {
        ...state,
        queue: action.payload,
      };
    case 'NEXT_SONG':
      const nextIndex = state.currentIndex + 1;
      return nextIndex < state.queue.length 
        ? { 
            ...state, 
            currentIndex: nextIndex, 
            currentSong: state.queue[nextIndex],
            progress: 0 
          }
        : state;
    case 'PREV_SONG':
      const prevIndex = state.currentIndex - 1;
      return prevIndex >= 0
        ? { 
            ...state, 
            currentIndex: prevIndex, 
            currentSong: state.queue[prevIndex],
            progress: 0 
          }
        : state;
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
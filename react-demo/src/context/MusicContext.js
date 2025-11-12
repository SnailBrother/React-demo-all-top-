// src/context/MusicContext.js 创建音乐上下文管理播放器状态
import React, { createContext, useContext, useReducer } from 'react';

const MusicContext = createContext();

// 初始状态 - 精简版
const initialState = {
  currentSong: null,
  isPlaying: false,
  volume: 1,
  queue: [],
  currentIndex: -1,
};

// Reducer - 精简版
function musicReducer(state, action) {
  switch (action.type) {
    case 'PLAY_SONG':
      return {
        ...state,
        currentSong: action.payload.song,
        queue: action.payload.queue,
        currentIndex: action.payload.index,
        isPlaying: true,
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
      };
    case 'PREV_SONG':
      if (state.queue.length === 0) return state;
      const prevIndex = (state.currentIndex - 1 + state.queue.length) % state.queue.length;
      return {
        ...state,
        currentIndex: prevIndex,
        currentSong: state.queue[prevIndex],
        isPlaying: true,
      };
    default:
      return state;
  }
}

// Provider组件 (无需修改)
export const MusicProvider = ({ children }) => {
  const [state, dispatch] = useReducer(musicReducer, initialState);

  return (
    <MusicContext.Provider value={{ state, dispatch }}>
      {children}
    </MusicContext.Provider>
  );
};

// Hook (无需修改)
export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};

export default MusicContext;
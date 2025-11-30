//App.js
// App.js
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { MusicProvider } from './context/MusicContext';
import { MessageProvider } from './components/UI/Message';
import AppRoutes from './routes';
import './assets/styles/variables.css';
import styles from './App.module.css';
import { TravelThemeProvider } from './pages/modules/travel/ThemeContext';
import { AccountingProvider } from './pages/modules/accounting/AccountingDataContext/AccountingContext';

// 主题初始化包装组件
const ThemeInitializedApp = ({ children }) => {
  const { loading, themeInitialized } = useTheme();

  // 如果主题还在初始化中，显示加载界面
  if (loading || !themeInitialized) {
    return (
      <div className={styles.themeLoading}>
        <div className={styles.loadingContent}>
          <div className={styles.loadingSpinner}></div>
          <p>加载主题中...</p>
        </div>
      </div>
    );
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <ThemeInitializedApp>
            <TravelThemeProvider>
              <MusicProvider>
                <MessageProvider>
                  <AccountingProvider>
                    <div className={styles.app}>
                      <AppRoutes />
                    </div>
                  </AccountingProvider>
                </MessageProvider>
              </MusicProvider>
            </TravelThemeProvider>
          </ThemeInitializedApp>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
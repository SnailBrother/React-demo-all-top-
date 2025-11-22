//App.js
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { MusicProvider } from './context/MusicContext';
import { MessageProvider } from './components/UI/Message';
import AppRoutes from './routes';
import './assets/styles/variables.css';
import styles from './App.module.css';
import { TravelThemeProvider } from './pages/modules/travel/ThemeContext'; // 根据你的实际路径调整
import { AccountingProvider } from './pages/modules/accounting/AccountingDataContext/AccountingContext';//记账配置
function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>

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

        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
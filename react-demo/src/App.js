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
import { AccountingProvider } from './pages/modules/accounting/AccountingDataContext/AccountingContext';//记账配置
function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <MusicProvider>
            <MessageProvider>
              <AccountingProvider>
                <div className={styles.app}>
                  <AppRoutes />

                </div>
              </AccountingProvider>
            </MessageProvider>
          </MusicProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
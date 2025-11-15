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

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <MusicProvider>
            <MessageProvider>

              <div className={styles.app}>
                <AppRoutes />
              </div>

            </MessageProvider>
          </MusicProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
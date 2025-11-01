import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { MessageProvider } from './components/UI/Message';
import AppRoutes from './routes';
import './assets/styles/globals.css';
import './assets/styles/variables.css';
import './assets/styles/mixins.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MessageProvider>
          <Router>
            <div className="App">
              <AppRoutes />
            </div>
          </Router>
        </MessageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
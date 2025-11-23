// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Importiert deine NEUE App.jsx (den Router)
import './index.css';
import { AuthProvider } from './lib/AuthContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider> {/* AuthProvider MUSS hier außen sein */}
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('✅ SW registered:', registration);
      })
      .catch(error => {
        console.log('❌ SW registration failed:', error);
      });
  });
}
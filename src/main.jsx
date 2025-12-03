// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from './lib/AuthContext';
import { CurrencyProvider } from './lib/CurrencyContext';

// 🔥 KILL SWITCH: Löscht alte Service Worker, die Probleme machen
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      console.log('Service Worker gefunden und entfernt:', registration);
      registration.unregister();
    }
  });
  // Erzwingt einen Reload, falls der Controller noch aktiv war (optional, aber sicher)
  if (window.navigator && navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CurrencyProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </CurrencyProvider>
  </React.StrictMode>,
);
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
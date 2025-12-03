// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from './lib/AuthContext';
import { CurrencyProvider } from './lib/CurrencyContext';

// 🔥 KILL SWITCH: Löscht alte Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      console.log('🗑️ Service Worker entfernt:', registration);
      registration.unregister();
    }
  });
}

// ✅ NUR EIN RENDER (mit Providern)
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CurrencyProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </CurrencyProvider>
  </React.StrictMode>,
);

console.log('💻 Development Mode: Kein Service Worker (kein White Screen)');
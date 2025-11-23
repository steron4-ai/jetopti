// src/components/Toast.jsx
import React from 'react';
import './Toast.css'; // Importiert die CSS-Datei aus demselben Ordner

function Toast({ message, type, onClose }) {
  return (
    <div className={`toast-notification toast-${type}`}>
      <span className="toast-message">{message}</span>
      <button className="toast-close-btn" onClick={onClose}>&times;</button>
    </div>
  );
}

export default Toast;
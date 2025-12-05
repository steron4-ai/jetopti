// src/Footer.jsx - KOMPLETT ERSETZEN
import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <div className="map-footer-attribution">
      <span>© 2025 JetOpti • Book Fast. Fly Smart.</span>
      <span className="footer-separator"> | </span>
      <Link to="/imprint">Imprint</Link>
      <span className="footer-separator"> | </span>
      <Link to="/privacy">Privacy</Link>
      <span className="footer-separator"> | </span>
      <Link to="/terms">Terms</Link>
    </div>
  );
}

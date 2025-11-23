import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-links">
          <Link to="/impressum" className="footer-link">Impressum</Link>
          <span className="footer-separator">•</span>
          <Link to="/datenschutz" className="footer-link">Datenschutz</Link>
        </div>
        <div className="footer-copyright">
          © 2025 JetOpti • Book Fast. Fly Smart.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
// src/components/UserMenu.jsx
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import './UserMenu.css'; 

export default function UserMenu() {
  const { user, profile, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate(); 

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
    setIsOpen(false);
    navigate('/'); 
  };

  const getRoleName = () => {
    if (profile?.role === 'charter_company') return 'Charterfirma';
    if (profile?.role === 'admin') return 'Administrator';
    return 'Kunde';
  };

  const handleNavigate = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        className="user-menu-trigger user-menu-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="company-full-name">{profile?.company_name || user?.email?.split('@')[0] || 'Menü'}</span>
        <span className="dropdown-arrow user-menu-caret">▼</span>
      </button>

      {isOpen && (
        <div className="user-menu-dropdown">
          <div className="user-menu-header">
            <div className="user-info">
              <div className="user-name">
                {profile?.company_name || user?.email?.split('@')[0]}
              </div>
              <div className="user-role">{getRoleName()}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>

          <div className="user-menu-divider" />

          <div className="user-menu-items">
            {/* Dashboard-Link nur für Charterfirmen */}
            {profile?.role === 'charter_company' && (
              <button className="user-menu-item" onClick={() => handleNavigate('/dashboard')}>
                <span className="menu-icon">📊</span>
                Dashboard
              </button>
            )}

            {/* Admin-Link (falls benötigt) */}
            {profile?.role === 'admin' && (
               <button className="user-menu-item" onClick={() => handleNavigate('/admin')}>
                 <span className="menu-icon">⚙️</span>
                 Admin Panel
               </button>
            )}

            {/* --- NEU: Buchungen-Link (Nur für Kunden) --- */}
            {profile?.role === 'customer' && (
              <button className="user-menu-item" onClick={() => handleNavigate('/my-bookings')}>
                <span className="menu-icon">✈️</span>
                Meine Buchungen
              </button>
            )}

            {/* Profil-Link */}
            <button className="user-menu-item" onClick={() => handleNavigate('/profile')}>
              <span className="menu-icon">👤</span>
              Profil bearbeiten
            </button>

             {/* Einstellungen-Link */}
             <button className="user-menu-item" onClick={() => handleNavigate('/settings')}>
               <span className="menu-icon">⚙️</span>
               Einstellungen
             </button>
          </div>

          <div className="user-menu-divider" />

          <button
            onClick={handleLogout}
            className="user-menu-item user-menu-logout"
          >
            <span className="menu-icon">🚪</span>
            Abmelden
          </button>
        </div>
      )}
    </div>
  );
}
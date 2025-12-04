// src/App.jsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/AuthContext';

// ============================================
// LANDING PAGE
// ============================================
import Landing from './pages/Landing';

// ============================================
// EXISTING PAGES
// ============================================
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import MyBookings from './pages/MyBookings';
import Imprint from './pages/Imprint';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';


// ============================================
// PROTECTED ROUTE: CHARTER COMPANY
// ============================================
function CharterRoute({ children }) {
  const { user, loading, profile } = useAuth(); 
  
  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#1e1e2d' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(255,255,255,0.1)',
            borderTopColor: '#667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{color: 'white', fontSize: '1.2rem'}}>
            Authentifizierung wird geladen...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (!profile) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#1e1e2d' 
      }}>
        <p style={{color: 'white', fontSize: '1.2rem'}}>
          Profil wird geladen...
        </p>
      </div>
    );
  }

  if (profile.role !== 'charter_company') {
    return <Navigate to="/" replace />;
  }

  return children;
}


// ============================================
// PROTECTED ROUTE: CUSTOMER
// ============================================
function CustomerRoute({ children }) {
  const { user, loading, profile } = useAuth(); 
  
  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#1e1e2d' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(255,255,255,0.1)',
            borderTopColor: '#667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{color: 'white', fontSize: '1.2rem'}}>
            Authentifizierung wird geladen...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (!profile) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#1e1e2d' 
      }}>
        <p style={{color: 'white', fontSize: '1.2rem'}}>
          Profil wird geladen...
        </p>
      </div>
    );
  }

  if (profile.role !== 'customer') {
    return <Navigate to="/" replace />;
  }

  return children;
}


// ============================================
// MAIN APP COMPONENT
// ============================================
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Landing />} />
        <Route path="/map" element={<Home />} />
        <Route path="/imprint" element={<Imprint />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />

        {/* PROTECTED ROUTES */}
        <Route 
          path="/dashboard" 
          element={
            <CharterRoute>
              <Dashboard />
            </CharterRoute>
          } 
        />

        <Route 
          path="/my-bookings" 
          element={
            <CustomerRoute>
              <MyBookings />
            </CustomerRoute>
          } 
        />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

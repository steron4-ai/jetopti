// src/App.jsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/AuthContext';

// ============================================
// LANDING PAGE (NEU!)
// ============================================
import Landing from './pages/Landing';

// ============================================
// EXISTING PAGES (Von Gemini)
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
  <Route path="/" element={<Landing />} />
  <Route path="/map" element={<Home />} />
  
  {/* NEU: Legal Pages */}
  <Route path="/imprint" element={<Imprint />} />
  <Route path="/privacy" element={<Privacy />} />
  <Route path="/terms" element={<Terms />} />
  
  {/* ... andere Routes */}
</Routes>
      <Routes>
        
        {/* ========================================
            PUBLIC ROUTES (Keine Auth nötig)
        ======================================== */}
        
        {/* Landing Page - NEUE HOMEPAGE! */}
        <Route path="/" element={<Landing />} />
        
        {/* Map View - Deine Karte (jetzt unter /map) */}
        <Route path="/map" element={<Home />} />
        
        {/* Login/Register kannst du später hinzufügen:
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        */}


        {/* ========================================
            PROTECTED ROUTES (Auth required)
        ======================================== */}
        
        {/* Charter Company Dashboard */}
        <Route 
          path="/dashboard" 
          element={
            <CharterRoute>
              <Dashboard />
            </CharterRoute>
          } 
        />

        {/* Customer Bookings */}
        <Route 
          path="/my-bookings" 
          element={
            <CustomerRoute>
              <MyBookings />
            </CustomerRoute>
          } 
          
        />
        


        {/* ========================================
            FALLBACK - 404
        ======================================== */}
        
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}


// ============================================
// CSS ANIMATION (für Spinner)
// ============================================
// Füge das in deine index.css oder App.css ein:
/*
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
*/
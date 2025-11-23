import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export default function ProtectedRoute({ children, requireRole = null }) {
  const { user, profile, loading } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#8b5cf6'
      }}>
        Lädt...
      </div>
    );
  }

  // Not logged in -> redirect to home
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Check role requirement
  if (requireRole && profile?.role !== requireRole) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h2>⛔ Zugriff verweigert</h2>
        <p>Sie haben keine Berechtigung für diese Seite.</p>
        <button 
          onClick={() => window.location.href = '/'}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Zurück zur Startseite
        </button>
      </div>
    );
  }

  // Authorized!
  return children;
}

import { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import './Auth.css';

export default function Login({ onSwitchToSignup, onClose }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validation
    if (!email || !password) {
      setError('Bitte alle Felder ausfüllen');
      setLoading(false);
      return;
    }

    const { data, error } = await signIn(email, password);

    if (error) {
      setError(error.message === 'Invalid login credentials' 
        ? 'Email oder Passwort falsch' 
        : error.message);
      setLoading(false);
    } else {
      // Success - close modal
      onClose();
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-modal">
        <button className="auth-close" onClick={onClose}>×</button>
        
        <div className="auth-header">
          <h2>Willkommen zurück!</h2>
          <p>Melden Sie sich an um fortzufahren</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error">
              ⚠️ {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="ihre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Passwort</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button 
            type="submit" 
            className="auth-submit"
            disabled={loading}
          >
            {loading ? 'Wird angemeldet...' : 'Anmelden'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Noch kein Account?{' '}
            <button 
              className="auth-switch" 
              onClick={onSwitchToSignup}
              disabled={loading}
            >
              Jetzt registrieren
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

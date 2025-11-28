// src/components/Signup.jsx
// BASIEREND AUF DEINEM BACKUP, ABER MIT KORRIGIERTEM HANDLESUBMIT

import { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import './Auth.css';

export default function Signup({ onSwitchToLogin, onClose }) {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'charter_company', // default
    companyName: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // --- KORRIGIERTE HANDLESUBMIT FUNKTION ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validation
    if (!formData.email || !formData.password) {
      setError('Bitte Email und Passwort eingeben');
      setLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein');
      setLoading(false);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      setLoading(false);
      return;
    }
    if (formData.role === 'charter_company' && !formData.companyName) {
      setError('Bitte Firmennamen eingeben');
      setLoading(false);
      return;
    }
    if (
      formData.role === 'customer' &&
      (!formData.firstName || !formData.lastName)
    ) {
      setError('Bitte Vor- und Nachnamen eingeben');
      setLoading(false);
      return;
    }

    // --- HIER IST DER FIX ---
    const isCharter = formData.role === 'charter_company';

    // Basisdaten für Auth + Profile
    const userData = {
      role: isCharter ? 'charter_company' : 'customer',
      phone: formData.phone || null,
      // Kunde ist sofort freigeschaltet, Charterfirma nach Prüfung
      is_approved: isCharter ? false : true,
    };

    if (formData.role === 'customer') {
      userData.company_name = `${formData.firstName} ${formData.lastName}`;
      userData.first_name = formData.firstName;
      userData.last_name = formData.lastName;
    } else {
      userData.company_name = formData.companyName;
    }
    // --- ENDE DES FIX ---

    // Sign up
    const { data, error } = await signUp(
      formData.email,
      formData.password,
      userData
    );

    if (error) {
      setError(
        error.message === 'User already registered'
          ? 'Diese Email ist bereits registriert'
          : 'Datenbankfehler: ' + error.message
      );
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 3000);
    }
  };
  // --- ENDE: KORRIGIERTE HANDLESUBMIT FUNKTION ---

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-modal">
          <button className="auth-close" onClick={onClose}>
            ×
          </button>

          <div className="auth-success">
            <div className="success-icon">✓</div>
            <h2>Erfolgreich registriert! 🎉</h2>
            <p>
              Bitte überprüfen Sie Ihre Email, um die Registrierung
              abzuschließen.
            </p>
            <p
              style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}
            >
              Dieses Fenster schließt sich automatisch...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-modal">
        <button className="auth-close" onClick={onClose}>
          ×
        </button>

        <div className="auth-header">
          <h2>Charterfirma registrieren</h2>
          <p>Erstellen Sie Ihren JetOpti-Account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">⚠️ {error}</div>}

          <div className="form-group">
            <label htmlFor="role">Ich bin...</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="charter_company">Charterfirma</option>
              <option value="customer">Kunde</option>
            </select>
          </div>

          {formData.role === 'charter_company' && (
            <div className="form-group">
              <label htmlFor="companyName">Firmenname *</label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                placeholder="z.B. Premium Jets GmbH"
                value={formData.companyName}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>
          )}

          {formData.role === 'customer' && (
            <>
              <div className="form-group">
                <label htmlFor="firstName">Vorname *</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="Max"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Nachname *</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Mustermann"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="ihre@email.com"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Telefon (optional)</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+49 123 456789"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Passwort *</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Mindestens 6 Zeichen"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Passwort bestätigen *</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Passwort wiederholen"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Wird registriert...' : 'Jetzt registrieren'}
          </button>

          <p className="auth-terms">
            Mit der Registrierung akzeptieren Sie unsere{' '}
            <a href="/agb" target="_blank" rel="noreferrer">
              AGB
            </a>{' '}
            und{' '}
            <a href="/datenschutz" target="_blank" rel="noreferrer">
              Datenschutzerklärung
            </a>
            .
          </p>
        </form>

        <div className="auth-footer">
          <p>
            Bereits registriert?{' '}
            <button
              className="auth-switch"
              onClick={onSwitchToLogin}
              disabled={loading}
            >
              Jetzt anmelden
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

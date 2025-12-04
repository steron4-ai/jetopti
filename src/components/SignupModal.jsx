// src/components/SignupModal.jsx
// UNIFIED VERSION - Dark Design + Role Switching + English
// Works for both Landing Page AND Map Page

import { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import './SignupModal.css';

export default function SignupModal({ isOpen, onClose, onSwitchToLogin }) {
  const { signUp } = useAuth();
  
  const [formData, setFormData] = useState({
    role: 'charter_company', // charter_company or customer
    companyName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!formData.email || !formData.password) {
      setError('Please enter email and password');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.role === 'charter_company' && !formData.companyName) {
      setError('Please enter company name');
      return;
    }
    
    if (formData.role === 'customer' && (!formData.firstName || !formData.lastName)) {
      setError('Please enter first and last name');
      return;
    }

    setLoading(true);

    try {
      const isCharter = formData.role === 'charter_company';

      // User data for Auth + Profile
      const userData = {
        role: isCharter ? 'charter_company' : 'customer',
        phone: formData.phone || null,
        is_approved: isCharter ? false : true, // Customer approved, Charter needs review
      };

      if (formData.role === 'customer') {
        userData.company_name = `${formData.firstName} ${formData.lastName}`;
        userData.first_name = formData.firstName;
        userData.last_name = formData.lastName;
      } else {
        userData.company_name = formData.companyName;
      }

      // Sign up with Supabase via AuthContext
      const { data, error: signupError } = await signUp(
        formData.email,
        formData.password,
        userData
      );

      if (signupError) {
        throw signupError;
      }

      // Success!
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 3000);
      
    } catch (err) {
      console.error('Signup error:', err);
      setError(
        err.message === 'User already registered'
          ? 'This email is already registered'
          : err.message || 'Registration failed'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Success Screen
  if (success) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>

          <div className="modal-header">
            <div className="success-icon">✓</div>
            <h2>Successfully Registered! 🎉</h2>
            <p style={{ color: '#a0aec0', marginTop: '10px', fontSize: '16px' }}>
              Please check your email to complete registration.
            </p>
            <p style={{ fontSize: '14px', color: '#718096', marginTop: '10px' }}>
              This window will close automatically...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button */}
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>

        {/* Header */}
        <div className="modal-header">
          <h2>Create Your JetOpti Account</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="signup-form">
          
          {/* User Type */}
          <div className="form-group">
            <label>I am...</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
              required
            >
              <option value="charter_company">Charter Company</option>
              <option value="customer">Customer</option>
            </select>
          </div>

          {/* Charter Company Fields */}
          {formData.role === 'charter_company' && (
            <div className="form-group">
              <label>Company Name *</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="e.g. Premium Jets GmbH"
                disabled={loading}
                required
              />
            </div>
          )}

          {/* Customer Fields */}
          {formData.role === 'customer' && (
            <>
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  disabled={loading}
                  required
                />
              </div>
            </>
          )}

          {/* Email */}
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              disabled={loading}
              required
            />
          </div>

          {/* Phone */}
          <div className="form-group">
            <label>Phone (optional)</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+49 123 456789"
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              disabled={loading}
              required
            />
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label>Confirm Password *</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat password"
              disabled={loading}
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register Now'}
          </button>

          {/* Terms */}
          <p className="terms">
            By registering you accept our{' '}
            <a href="/agb" target="_blank">Terms</a> and{' '}
            <a href="/datenschutz" target="_blank">Privacy Policy</a>.
          </p>
        </form>

        {/* Switch to Login (only if onSwitchToLogin is provided) */}
        {onSwitchToLogin && (
          <div className="auth-footer">
            <p style={{ textAlign: 'center', color: '#a0aec0', margin: '0 0 20px 0' }}>
              Already registered?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#667eea',
                  cursor: 'pointer',
                  fontWeight: '600',
                  textDecoration: 'underline'
                }}
              >
                Sign in now
              </button>
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

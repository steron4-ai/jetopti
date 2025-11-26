import { useState } from 'react';
import emailjs from '@emailjs/browser';
import './ContactForm.css';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  });
  
  const [status, setStatus] = useState(''); // 'sending', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMessage('');

    try {
      await emailjs.send(
        'service_cw6x40c',
        'template_jgrdble',
        {
          from_name: formData.name,
          from_email: formData.email,
          company: formData.company || 'Nicht angegeben',
          message: formData.message,
          to_email: 'info@jetopti.com'
        },
        'IxnCuOKoR-MuFZVQw'
      );

      setStatus('success');
      setFormData({ name: '', email: '', company: '', message: '' });
      
      // Success message nach 5 Sekunden ausblenden
      setTimeout(() => setStatus(''), 5000);
      
    } catch (error) {
      console.error('Email send error:', error);
      setStatus('error');
      setErrorMessage('Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es erneut.');
    }
  };

  return (
    <section className="contact-section" id="contact">
      <div className="contact-container">
        <div className="contact-header">
          <h2 className="contact-title">Kontaktieren Sie uns</h2>
          <p className="contact-subtitle">
            Haben Sie Fragen? Wir sind für Sie da und antworten innerhalb von 24 Stunden.
          </p>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Ihr Name"
                disabled={status === 'sending'}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">E-Mail *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="ihre@email.com"
                disabled={status === 'sending'}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="company">Firma (optional)</label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="Ihr Unternehmen"
              disabled={status === 'sending'}
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Nachricht *</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows="5"
              placeholder="Wie können wir Ihnen helfen?"
              disabled={status === 'sending'}
            />
          </div>

          <button 
            type="submit" 
            className="contact-submit-btn"
            disabled={status === 'sending'}
          >
            {status === 'sending' ? (
              <>
                <span className="spinner"></span>
                Wird gesendet...
              </>
            ) : (
              <>
                Nachricht senden
                <span className="btn-arrow">→</span>
              </>
            )}
          </button>

          {status === 'success' && (
            <div className="status-message success">
              <span className="status-icon">✓</span>
              Vielen Dank! Ihre Nachricht wurde erfolgreich gesendet. Wir melden uns in Kürze bei Ihnen.
            </div>
          )}

          {status === 'error' && (
            <div className="status-message error">
              <span className="status-icon">✕</span>
              {errorMessage}
            </div>
          )}
        </form>

        <div className="contact-info">
          <div className="info-item">
            <span className="info-icon">📧</span>
            <span>info@jetopti.com</span>
          </div>
          <div className="info-item">
            <span className="info-icon">⏱️</span>
            <span>Antwort innerhalb von 24 Stunden</span>
          </div>
        </div>
      </div>
    </section>
  );
}

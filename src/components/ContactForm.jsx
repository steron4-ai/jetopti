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
          company: formData.company || 'Not provided',
          message: formData.message,
          to_email: 'info@jetopti.com'
        },
        'IxnCuOKoR-MuFZVQw'
      );

      setStatus('success');
      setFormData({ name: '', email: '', company: '', message: '' });
      
      // Hide success message after 5 seconds
      setTimeout(() => setStatus(''), 5000);
      
    } catch (error) {
      console.error('Email send error:', error);
      setStatus('error');
      setErrorMessage('Message could not be sent. Please try again.');
    }
  };

  return (
    <section className="contact-section" id="contact">
      <div className="contact-container">
        <div className="contact-header">
          <h2 className="contact-title">Get in Touch</h2>
          <p className="contact-subtitle">
            Have questions? We're here to help and respond within 24 hours.
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
                placeholder="Your name"
                disabled={status === 'sending'}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your@email.com"
                disabled={status === 'sending'}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="company">Company (optional)</label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="Your company"
              disabled={status === 'sending'}
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Message *</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows="5"
              placeholder="How can we help you?"
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
                Sending...
              </>
            ) : (
              <>
                Send Message
                <span className="btn-arrow">→</span>
              </>
            )}
          </button>

          {status === 'success' && (
            <div className="status-message success">
              <span className="status-icon">✓</span>
              Thank you! Your message was sent successfully. We'll get back to you shortly.
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
            <span>Response within 24 hours</span>
          </div>
        </div>
      </div>
    </section>
  );
}
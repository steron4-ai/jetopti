// src/components/AIJetMatchDialog.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './AIJetMatchDialog.css';

function AIJetMatchDialog({ isOpen, onClose, onSuccess, airports = [], user = null, onLoginRequired = null }) {
  const [formData, setFormData] = useState({
    fromIATA: '',
    toIATA: '',
    passengers: 1,
    dateTime: '',
    name: '',
    email: '',
    phone: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [minDateTime, setMinDateTime] = useState('');
  const [estimatedMinLeadTime, setEstimatedMinLeadTime] = useState(6);

  useEffect(() => {
    const fetchMinLeadTime = async () => {
      try {
        const { data: jets, error } = await supabase
          .from('jets')
          .select('lead_time_hours')
          .eq('status', 'verfügbar');
        
        if (!error && jets && jets.length > 0) {
          const minLeadTime = Math.min(...jets.map(j => j.lead_time_hours || 4));
          const totalMinTime = minLeadTime + 2;
          setEstimatedMinLeadTime(totalMinTime);
          
          const now = new Date();
          now.setHours(now.getHours() + totalMinTime);
          setMinDateTime(now.toISOString().slice(0, 16));
        } else {
          const now = new Date();
          now.setHours(now.getHours() + 6);
          setMinDateTime(now.toISOString().slice(0, 16));
        }
      } catch (err) {
        console.error('Fehler beim Laden der Lead-Times:', err);
        const now = new Date();
        now.setHours(now.getHours() + 6);
        setMinDateTime(now.toISOString().slice(0, 16));
      }
    };
    
    if (isOpen) {
      fetchMinLeadTime();
      setError('');
      setFormData({
        fromIATA: '',
        toIATA: '',
        passengers: 1,
        dateTime: '',
        name: '',
        email: '',
        phone: ''
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const selectedDateTime = new Date(formData.dateTime);
      const now = new Date();
      const hoursUntilFlight = (selectedDateTime - now) / (1000 * 60 * 60);
      
      if (hoursUntilFlight < estimatedMinLeadTime) {
        throw new Error(
          `Die Abflugzeit muss mindestens ${estimatedMinLeadTime} Stunden in der Zukunft liegen. ` +
          `Dies berücksichtigt die Vorlaufzeit der Jets und die Anflugdistanz zum Startflughafen. ` +
          `Bitte wählen Sie eine spätere Zeit.`
        );
      }

      const { data, error: functionError } = await supabase.functions.invoke('ai-jet-match', {
        body: {
          fromIATA: formData.fromIATA,
          toIATA: formData.toIATA,
          passengers: parseInt(formData.passengers),
          dateTime: formData.dateTime
        }
      });

      if (functionError) throw functionError;

      if (data.error) {
        if (data.error.includes('Kein passender Jet gefunden')) {
          throw new Error(
            `Für die gewählte Abflugzeit wurde kein passender Jet gefunden. ` +
            `Grund: Die Vorlaufzeit ist zu kurz. Bitte wählen Sie eine spätere Abflugzeit ` +
            `(mindestens ${estimatedMinLeadTime + 2} Stunden) oder kontaktieren Sie uns.`
          );
        }
        throw new Error(data.error);
      }

      onSuccess({
        ...data,
        customerInfo: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone
        },
        searchParams: {
          fromIATA: formData.fromIATA,
          toIATA: formData.toIATA,
          passengers: formData.passengers,
          dateTime: formData.dateTime
        }
      });
      onClose();

    } catch (err) {
      console.error('AI Jet Match Fehler:', err);
      setError(err.message || 'Ein Fehler ist aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content ai-jet-match-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <h2>✨ AI Jet Match</h2>
        <p className="modal-subtitle">
          Wir finden automatisch den besten Jet für Ihre Route
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Startflughafen (IATA-Code) *</label>
            <input
              type="text"
              placeholder="z.B. FRA"
              maxLength={3}
              value={formData.fromIATA}
              onChange={(e) => setFormData({ ...formData, fromIATA: e.target.value.toUpperCase() })}
              required
            />
            <small className="help-text">Dreistelliger IATA-Code (z.B. FRA für Frankfurt)</small>
          </div>

          <div className="form-group">
            <label>Zielflughafen (IATA-Code) *</label>
            <input
              type="text"
              placeholder="z.B. INN"
              maxLength={3}
              value={formData.toIATA}
              onChange={(e) => setFormData({ ...formData, toIATA: e.target.value.toUpperCase() })}
              required
            />
            <small className="help-text">Dreistelliger IATA-Code (z.B. INN für Innsbruck)</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Anzahl Passagiere *</label>
              <select
                value={formData.passengers}
                onChange={(e) => setFormData({ ...formData, passengers: e.target.value })}
                required
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                  <option key={num} value={num}>{num} Passagier{num > 1 ? 'e' : ''}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Abflugdatum und -uhrzeit *</label>
              <input
                type="datetime-local"
                value={formData.dateTime}
                min={minDateTime}
                onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
                required
              />
              <small className="help-text">
                Mind. {estimatedMinLeadTime}h im Voraus
              </small>
            </div>
          </div>

          <div className="form-group">
            <label>Ihr Name *</label>
            <input
              type="text"
              placeholder="Max Mustermann"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>E-Mail-Adresse *</label>
            <input
              type="email"
              placeholder="max@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Telefon (Optional)</label>
            <input
              type="tel"
              placeholder="Für schnelle Rückfragen"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          {error && (
            <div className="error-message">
              <strong>⚠️ Hinweis:</strong> {error}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Abbrechen
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? '🔍 Suche läuft...' : '✈️ Besten Jet finden'}
            </button>
          </div>
        </form>

        <div className="info-box">
          <p><strong>ℹ️ So funktioniert AI Jet Match:</strong></p>
          <ul>
            <li>✓ Berücksichtigt die <strong>Vorlaufzeit</strong> des Jets</li>
            <li>✓ Berechnet die <strong>Anflugdistanz</strong> automatisch</li>
            <li>✓ Prüft <strong>Reichweite</strong> und <strong>Kapazität</strong></li>
            <li>✓ Findet den <strong>besten Preis</strong></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AIJetMatchDialog;

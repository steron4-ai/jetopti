// src/pages/Dashboard.jsx
// ✅ FINAL - PHASE 1: E-Mail-Logik + Storno-Button + Stripe-Teaser implementiert

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { MAP_ROUTE } from '../lib/routes';
import emailjs from '@emailjs/browser';
import './Dashboard.css';
import Toast from '../components/Toast';
import { useCurrency } from '../lib/CurrencyContext';
import AirportSearchInput from '../components/AirportSearchInput';


// --- NEUE PROFIL-EDITOR KOMPONENTE ---
function ProfileEditor({ profile, onSave }) {
  const [companyName, setCompanyName] = useState(profile?.company_name || '');
  const [bookingEmail, setBookingEmail] = useState(profile?.booking_notification_email || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      company_name: companyName,
      booking_notification_email: bookingEmail
    });
  };

  return (
    <div className="profile-section">
      <h2>Profil</h2>
      <form onSubmit={handleSubmit} className="jet-form" style={{ maxWidth: '600px', margin: '0' }}>
        <label>Login-E-Mail (Nicht änderbar)</label>
        <input type="email" value={profile?.email || ''} disabled />
        
        <label htmlFor="company_name">Firmenname</label>
        <input 
          id="company_name"
          type="text" 
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)} 
          placeholder="Ihr Firmenname" 
        />
        
        <label htmlFor="booking_notification_email">E-Mail für Buchungsanfragen (Optional)</label>
        <input 
          id="booking_notification_email"
          type="email" 
          value={bookingEmail}
          onChange={(e) => setBookingEmail(e.target.value)}
          placeholder="z.B. anfragen@charterfirma.de" 
        />
        <small>Wenn leer, wird die Login-E-Mail verwendet.</small>
        
        <div className="form-actions">
          <button type="submit" className="btn-primary">Profil speichern</button>
        </div>
      </form>
    </div>
  );
}
// --- ENDE PROFIL-EDITOR ---

// ===================================================================
// HILFSKOMPONENTEN (FORMULAR + TABS)
// ===================================================================

// --- JetForm Komponente (✨ ERWEITERT mit Stundenpreis) ---
// --- JetForm Komponente (✨ ERWEITERT mit Stundenpreis & robusten Airport-Suggestions) ---
function JetForm({ onSubmit, onCancel, initialData = null, airports }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    type: initialData?.type || 'Light Jet',
    icao24: initialData?.icao24 || '',
    seats: initialData?.seats || 4,
    range: initialData?.range || 3000,
    current_iata: initialData?.current_iata || '',
    image_url: initialData?.image_url || '',
    image_file: null,

    lead_time_hours: initialData?.lead_time_hours || 4,
    home_base_iata: initialData?.home_base_iata || '',
    price_per_hour: initialData?.price_per_hour || '', // Stundenpreis
    min_booking_price: initialData?.min_booking_price || 5000,
    year_built: initialData?.year_built || '',

    gallery_files: null,

    // ✨ Empty Legs Felder
    allow_empty_legs: initialData?.allow_empty_legs || false,
    empty_leg_discount: initialData?.empty_leg_discount || 50,
  });

      const [existingGallery, setExistingGallery] = useState([]);
  const [removedGallery, setRemovedGallery] = useState([]);

  // 🎯 Lade Galerie-Bilder aus initialData (egal ob Array oder JSON-String)
  useEffect(() => {
    if (!initialData) return;

    let urls = [];

    if (Array.isArray(initialData.gallery_urls)) {
      urls = initialData.gallery_urls;
    } else if (typeof initialData.gallery_urls === 'string') {
      try {
        const parsed = JSON.parse(initialData.gallery_urls);
        if (Array.isArray(parsed)) {
          urls = parsed;
        }
      } catch (e) {
        console.warn(
          'gallery_urls ist kein gültiges JSON:',
          initialData.gallery_urls
        );
      }
    }

    // Nur echte Strings übernehmen
    setExistingGallery(urls.filter(Boolean));
    console.log('🎨 JetForm – existingGallery geladen:', urls);
  }, [initialData]);


  const handleSetCoverFromGallery = (url) => {
    setFormData((prev) => ({
      ...prev,
      image_url: url,
    }));
  };

  const handleRemoveFromGallery = (url) => {
    setExistingGallery((prev) => prev.filter((u) => u !== url));
    setRemovedGallery((prev) => [...prev, url]);
  };


  const [isSubmitting, setIsSubmitting] = useState(false);
  const safeAirports = airports || [];

  const jetTypes = [
    'Very Light Jet',
    'Light Jet',
    'Super Light Jet',
    'Midsize Jet',
    'Super Midsize Jet',
    'Heavy Jet',
    'Ultra Long Range',
  ];

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData((prev) => ({
        ...prev,
        [name]: name === 'gallery_files' ? files : files[0] || null,
      }));
    } else if (name === 'current_iata' || name === 'home_base_iata') {
      setFormData((prev) => ({ ...prev, [name]: value }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // 🔍 sichere Vorschläge (kein toLowerCase auf null)
  const getSuggestions = (input) => {
    if (!input || !safeAirports.length) return [];
    const q = input.toLowerCase();

    return safeAirports
      .filter((a) => {
        const iata = (a.iata || '').toLowerCase();
        const city = (a.city || '').toLowerCase();
        return iata.includes(q) || city.includes(q);
      })
      .slice(0, 10);
  };

  // 🔍 Airport finden für Submit (IATA oder kompletter Stadtname)
  const findAirport = (input) => {
    if (!input) return null;
    const trimmed = input.trim();
    if (!trimmed) return null;

    const upper = trimmed.toUpperCase();

    return (
      safeAirports.find(
        (a) =>
          (a.iata && a.iata.toUpperCase() === upper) ||
          (a.city && a.city.toUpperCase() === upper)
      ) || null
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const seatsValue = parseInt(formData.seats, 10);
    const rangeValue = parseInt(formData.range, 10);
    const leadTimeValue = parseInt(formData.lead_time_hours, 10);
    const pricePerHourValue = parseFloat(formData.price_per_hour);
    const minPriceValue = parseFloat(formData.min_booking_price);
    const yearValue = formData.year_built
      ? parseInt(formData.year_built, 10)
      : null;

    const currentAirport = findAirport(formData.current_iata);
    const homeAirport = findAirport(formData.home_base_iata);

    if (!formData.name || !formData.type) {
      alert('Bitte Name und Typ ausfüllen.');
      return;
    }

    if (!currentAirport) {
      alert(
        `Fehler: Aktueller Flughafen "${formData.current_iata}" nicht gefunden. Bitte gültigen IATA-Code (z.B. EDDB) oder Stadtnamen verwenden.`
      );
      return;
    }

    if (formData.home_base_iata && !homeAirport) {
      alert(
        `Fehler: Heimatbasis "${formData.home_base_iata}" nicht gefunden. Bitte gültigen IATA-Code (z.B. EDDB) oder Stadtnamen verwenden (oder leer lassen).`
      );
      return;
    }

    setIsSubmitting(true);
    try {
          const submitData = {
      name: formData.name,
      icao24: formData.icao24.toUpperCase(),
      type: formData.type,
      seats: seatsValue,
      range: rangeValue,
      current_iata: currentAirport.iata,
      current_lat: currentAirport.lat,
      current_lng: currentAirport.lon,
      image_url: formData.image_url,
      image_file: formData.image_file,

      lead_time_hours: leadTimeValue,
      price_per_hour: pricePerHourValue,
      min_booking_price: minPriceValue,
      year_built: yearValue,
      home_base_iata: homeAirport ? homeAirport.iata : null,

      gallery_files: formData.gallery_files,

      // 👇 NEU: bestehende/gelöschte Galerie-Bilder mitgeben
      existing_gallery_urls: existingGallery,
      removed_gallery_urls: removedGallery,

      allow_empty_legs: formData.allow_empty_legs,
      empty_leg_discount: parseInt(formData.empty_leg_discount, 10),
    };


      await onSubmit(submitData, initialData?.id);
    } catch (error) {
      console.error('Error submitting form', error);
      alert('Ein Fehler ist aufgetreten: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="jet-form">
      <h2>{initialData ? 'Jet bearbeiten' : 'Neuen Jet hinzufügen'}</h2>

      <label htmlFor="name">Jet Name / Kennung *</label>
      <input
        id="name"
        name="name"
        type="text"
        value={formData.name}
        onChange={handleChange}
        placeholder="z.B. Citation XLS+ oder D-ABCD"
        required
      />

      <label htmlFor="icao24">ICAO24 Hex Code *</label>
      <input
        id="icao24"
        name="icao24"
        type="text"
        value={formData.icao24}
        onChange={handleChange}
        placeholder="z.B. 3C6444 (für D-IAAA)"
        style={{ textTransform: 'uppercase' }}
        maxLength="6"
        required
      />
      <small
        style={{
          display: 'block',
          marginTop: '-10px',
          marginBottom: '15px',
          color: '#6b7280',
        }}
      >
        6-stelliger Hex-Code für die Live-Position (ADS-B).{' '}
        <a
          href="https://www.adsbexchange.com/data/icao-adsb-decode-and-store/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Code hier nachschlagen
        </a>
        .
      </small>
            {existingGallery.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <p
            style={{
              fontWeight: 600,
              marginBottom: '8px',
              color: '#111827',
            }}
          >
            Bestehende Galerie-Bilder
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            {existingGallery.map((url) => (
              <div
                key={url}
                style={{
                  width: '120px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '6px',
                  background: '#f9fafb',
                }}
              >
                <img
                  src={url}
                  alt="Jet"
                  style={{
                    width: '100%',
                    height: '70px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    marginBottom: '4px',
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleSetCoverFromGallery(url)}
                  style={{
                    width: '100%',
                    fontSize: '11px',
                    padding: '4px 6px',
                    marginBottom: '4px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    background: '#e0f2fe',
                    color: '#1d4ed8',
                  }}
                >
                  Titelbild setzen
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveFromGallery(url)}
                  style={{
                    width: '100%',
                    fontSize: '11px',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    background: '#fee2e2',
                    color: '#b91c1c',
                  }}
                >
                  Entfernen
                </button>
              </div>
            ))}
          </div>
        </div>
      )}


      <label htmlFor="type">Jet-Typ *</label>
      <select
        id="type"
        name="type"
        value={formData.type}
        onChange={handleChange}
        required
      >
        {jetTypes.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>

      <label htmlFor="year_built">Baujahr (Optional)</label>
      <input
        id="year_built"
        name="year_built"
        type="number"
        value={formData.year_built}
        onChange={handleChange}
        placeholder="z.B. 2018"
        min="1950"
        max={new Date().getFullYear() + 1}
      />

      <div style={{ display: 'flex', gap: '15px' }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="seats">Sitze *</label>
          <input
            id="seats"
            name="seats"
            type="number"
            value={formData.seats}
            onChange={handleChange}
            placeholder="Anzahl Sitze"
            min="1"
            required
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="range">Reichweite (in km) *</label>
          <input
            id="range"
            name="range"
            type="number"
            value={formData.range}
            onChange={handleChange}
            placeholder="z.B. 3000"
            min="1"
            required
          />
        </div>
      </div>

      <label htmlFor="lead_time_hours">Vorlaufzeit (in Stunden) *</label>
      <input
        id="lead_time_hours"
        name="lead_time_hours"
        type="number"
        value={formData.lead_time_hours}
        onChange={handleChange}
        placeholder="z.B. 4"
        min="0"
        required
      />

      {/* --- PREIS SEKTION --- */}
      <div
        style={{
          display: 'flex',
          gap: '15px',
          background: '#f9fafb',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '15px',
          border: '1px solid #e5e7eb',
        }}
      >
        <div style={{ flex: 1 }}>
          <label
            htmlFor="price_per_hour"
            style={{ fontWeight: 'bold', color: '#1e3a8a' }}
          >
            Stundenpreis (€) *
          </label>
          <input
            id="price_per_hour"
            name="price_per_hour"
            type="number"
            value={formData.price_per_hour}
            onChange={handleChange}
            placeholder="z.B. 4500"
            min="0"
            required
            style={{ borderColor: '#bfdbfe' }}
          />
          <small
            style={{
              display: 'block',
              fontSize: '0.75rem',
              color: '#666',
            }}
          >
            Basis für Flugpreis-Berechnung.
          </small>
        </div>

        <div style={{ flex: 1 }}>
          <label
            htmlFor="min_booking_price"
            style={{ fontWeight: 'bold', color: '#1e3a8a' }}
          >
            Mindestpreis (€) *
          </label>
          <input
            id="min_booking_price"
            name="min_booking_price"
            type="number"
            value={formData.min_booking_price}
            onChange={handleChange}
            placeholder="z.B. 5000"
            min="0"
            required
            style={{ borderColor: '#bfdbfe' }}
          />
          <small
            style={{
              display: 'block',
              fontSize: '0.75rem',
              color: '#666',
            }}
          >
            Darunter hebt der Jet nicht ab.
          </small>
        </div>
      </div>

      <label htmlFor="home_base_iata">
        Heimatbasis (IATA-Code oder Stadt) (Optional)
      </label>
      <input
        id="home_base_iata"
        name="home_base_iata"
        type="text"
        value={formData.home_base_iata}
        onChange={handleChange}
        placeholder="z.B. EDDB oder Berlin"
        maxLength="30"
        list="home-airport-suggestions"
      />
      <datalist id="home-airport-suggestions">
        {getSuggestions(formData.home_base_iata).map((a) => (
          <option key={a.iata} value={a.iata}>
            {a.city} ({a.iata})
          </option>
        ))}
      </datalist>

      <label htmlFor="current_iata">
        Aktueller Standort (IATA-Code oder Stadt) *
      </label>
      <input
        id="current_iata"
        name="current_iata"
        type="text"
        value={formData.current_iata}
        onChange={handleChange}
        placeholder="z.B. EDDB oder Berlin"
        maxLength="30"
        list="current-airport-suggestions"
        required
      />
      <datalist id="current-airport-suggestions">
        {getSuggestions(formData.current_iata).map((a) => (
          <option key={a.iata} value={a.iata}>
            {a.city} ({a.iata})
          </option>
        ))}
      </datalist>

      {/* Cover-Bild */}
      <div className="form-divider">
        <span>Profilbild (für Hover & Modal)</span>
      </div>
      <label htmlFor="image_url">Bild-URL (Optional, wenn kein Upload)</label>
      <input
        id="image_url"
        name="image_url"
        type="text"
        value={formData.image_url}
        onChange={handleChange}
        placeholder="https://.../bild.jpg"
      />
      <label htmlFor="image_file">ODER Cover-Bild hochladen (bevorzugt)</label>
      <input
        id="image_file"
        name="image_file"
        type="file"
        accept="image/png, image/jpeg"
        onChange={handleChange}
        className="file-input"
      />

      {/* Galerie-Bilder */}
      <div className="form-divider">
        <span>Bildergalerie (Innenansichten etc.)</span>
      </div>
      <label htmlFor="gallery_files">
        Galerie-Bilder hochladen (max. 10, optional)
      </label>
      <input
        id="gallery_files"
        name="gallery_files"
        type="file"
        accept="image/png, image/jpeg"
        multiple
        onChange={handleChange}
        className="file-input"
      />
      <small
        style={{
          display: 'block',
          marginTop: '-10px',
          marginBottom: '15px',
          color: '#6b7280',
        }}
      >
        Hinweis: Sie können mehrere Bilder auswählen (Strg/Cmd + Klick). Diese
        werden alle hochgeladen.
      </small>

      {/* Empty Legs / Hot Deals */}
      <div className="form-divider" style={{ marginTop: '30px' }}>
        <span>🔥 Hot Deals / Empty Legs</span>
      </div>

      <div
        className="form-group-inline"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          padding: '15px',
          background: 'linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%)',
          borderRadius: '8px',
          border: '2px solid #fecaca',
          marginBottom: '15px',
        }}
      >
        <input
          type="checkbox"
          id="allow_empty_legs"
          name="allow_empty_legs"
          checked={formData.allow_empty_legs}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              allow_empty_legs: e.target.checked,
            }))
          }
          style={{
            width: '20px',
            height: '20px',
            cursor: 'pointer',
            accentColor: '#ef4444',
          }}
        />
        <label
          htmlFor="allow_empty_legs"
          style={{
            margin: 0,
            cursor: 'pointer',
            fontWeight: '600',
            color: '#991b1b',
          }}
        >
          ✈️ Empty Legs anbieten (Leerflüge als Hot Deals verkaufen)
        </label>
      </div>

      {formData.allow_empty_legs && (
        <div
          style={{
            padding: '20px',
            background: '#fef2f2',
            borderRadius: '8px',
            border: '1px solid #fecaca',
            marginBottom: '20px',
          }}
        >
          <label
            htmlFor="empty_leg_discount"
            style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#991b1b',
            }}
          >
            🏷️ Rabatt für Empty Legs (in %)
          </label>
          <input
            id="empty_leg_discount"
            name="empty_leg_discount"
            type="number"
            value={formData.empty_leg_discount}
            onChange={handleChange}
            min="10"
            max="90"
            placeholder="z.B. 50"
            required={formData.allow_empty_legs}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #fca5a5',
              borderRadius: '6px',
              fontSize: '16px',
            }}
          />
          <small
            style={{
              display: 'block',
              marginTop: '8px',
              color: '#7f1d1d',
              lineHeight: '1.5',
            }}
          >
            💡 <strong>Wie funktioniert&apos;s?</strong>
            <br />
            Wenn ein Kunde über AI Jet Match bucht und Ihr Jet zum
            Startflughafen fliegen muss, wird dieser Leerflug automatisch als
            &quot;Hot Deal&quot; mit {formData.empty_leg_discount}% Rabatt
            angeboten!
          </small>
        </div>
      )}

      {/* Submit Buttons */}
      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting
            ? 'Speichere...'
            : initialData
            ? 'Änderungen speichern'
            : 'Jet hinzufügen'}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel}
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}


// --- TabNav Komponente ---
function TabNav({ tabs, activeTab, onTabChange }) {
  return (
    <div className="tab-nav">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.icon} {tab.label}
          {tab.badge && <span className="tab-badge">{tab.badge}</span>}
        </button>
      ))}
    </div>
  );
}
// --- NEU: Preis-Simulator für Charterfirmen ----------------------

function PriceSimulator({ airports }) {
  const { formatPrice } = useCurrency();

  // ✨ REALISTISCHE MARKTPREISE (Durchschnittswerte aus der Branche)
  const JET_TYPE_DEFAULTS = {
    'Very Light Jet': { hourlyRate: 3000, minPrice: 4000 },
    'Light Jet': { hourlyRate: 4500, minPrice: 5000 },
    'Super Light Jet': { hourlyRate: 5000, minPrice: 6000 },
    'Midsize Jet': { hourlyRate: 6000, minPrice: 7000 },
    'Super Midsize Jet': { hourlyRate: 7500, minPrice: 9000 },
    'Heavy Jet': { hourlyRate: 9500, minPrice: 12000 },
    'Ultra Long Range': { hourlyRate: 12000, minPrice: 15000 },
  };

  // 🔍 VALIDIERUNGSBEREICHE (±40% Toleranz)
  const getValidationRange = (jetType) => {
    const defaults = JET_TYPE_DEFAULTS[jetType];
    return {
      minRealistic: Math.round(defaults.hourlyRate * 0.6), // -40%
      maxRealistic: Math.round(defaults.hourlyRate * 1.4), // +40%
      recommended: defaults.hourlyRate,
    };
  };

  const [form, setForm] = useState({
    jetType: 'Light Jet',
    pricePerHour: 4500,
    minPrice: 5000,
    fromIATA: '',
    toIATA: '',
    passengers: 4,
    dateTime: new Date().toISOString().slice(0, 16),
    roundtrip: false,
  });

  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [priceWarning, setPriceWarning] = useState(null);

  // ✨ PREIS-VALIDIERUNG
  const validatePrice = (jetType, price) => {
    const range = getValidationRange(jetType);
    
    if (price < range.minRealistic) {
      return {
        type: 'low',
        message: `⚠️ Ungewöhnlich niedrig für ${jetType}. Marktüblich: ${range.recommended.toLocaleString()} €/h`,
      };
    }
    
    if (price > range.maxRealistic) {
      return {
        type: 'high',
        message: `⚠️ Ungewöhnlich hoch für ${jetType}. Marktüblich: ${range.recommended.toLocaleString()} €/h`,
      };
    }
    
    return null;
  };

  // 🔄 HANDLER FÜR JET-TYP ÄNDERUNG (Auto-Anpassung)
  const handleJetTypeChange = (e) => {
    const newJetType = e.target.value;
    const defaults = JET_TYPE_DEFAULTS[newJetType];

    console.log(`✈️ Jet-Typ geändert zu: ${newJetType}`);
    console.log(`💰 Auto-Anpassung: ${defaults.hourlyRate} €/h, Min: ${defaults.minPrice} €`);

    setForm((prev) => ({
      ...prev,
      jetType: newJetType,
      pricePerHour: defaults.hourlyRate,
      minPrice: defaults.minPrice,
    }));

    // Warnung zurücksetzen
    setPriceWarning(null);
  };

  // 📝 HANDLER FÜR MANUELLE PREIS-ÄNDERUNG
  const handlePriceChange = (e) => {
    const newPrice = Number(e.target.value);
    
    setForm((prev) => ({
      ...prev,
      pricePerHour: newPrice,
    }));

    // Validiere Preis
    const warning = validatePrice(form.jetType, newPrice);
    setPriceWarning(warning);
  };

  // 📝 HANDLER FÜR ANDERE FELDER
  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      // Validierung
      if (!form.fromIATA || !form.toIATA) {
        throw new Error('Bitte Start- und Zielflughafen auswählen');
      }

      if (form.pricePerHour <= 0) {
        throw new Error('Stundenpreis muss größer als 0 sein');
      }

      console.log('🧮 Rufe simulate-price auf:', form);

      // ✅ Edge Function aufrufen
      const { data, error: functionError } = await supabase.functions.invoke(
        'simulate-price',
        {
          body: {
            jetType: form.jetType,
            pricePerHour: Number(form.pricePerHour),
            minPrice: Number(form.minPrice),
            fromIATA: form.fromIATA,
            toIATA: form.toIATA,
            passengers: Number(form.passengers),
            dateTime: form.dateTime,
            roundtrip: form.roundtrip,
          },
        }
      );

      if (functionError) {
        console.error('Edge Function Error:', functionError);
        throw new Error(functionError.message || 'Fehler bei der Preisberechnung');
      }

      if (!data || !data.ok) {
        throw new Error(data?.error || 'Unerwartete Antwort vom Server');
      }

      console.log('✅ Simulationsergebnis:', data);
      setResult(data);
    } catch (err) {
      console.error('Simulator-Fehler:', err);
      setError(err.message || 'Fehler bei der Simulation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="price-simulator">
      <h2>🧮 Preis-Simulator</h2>
      <p style={{ color: '#6b7280', marginBottom: '16px' }}>
        Testen Sie verschiedene Routen und Jet-Typen mit unserem Pricing V3
        Algorithmus.
      </p>

      <form className="jet-form" onSubmit={handleSubmit}>
        {/* Jet-Typ und Preise */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label>Jet-Typ</label>
            <select 
              name="jetType" 
              value={form.jetType} 
              onChange={handleJetTypeChange}
            >
              <option>Very Light Jet</option>
              <option>Light Jet</option>
              <option>Super Light Jet</option>
              <option>Midsize Jet</option>
              <option>Super Midsize Jet</option>
              <option>Heavy Jet</option>
              <option>Ultra Long Range</option>
            </select>
            <small style={{ display: 'block', marginTop: '4px', color: '#6b7280', fontSize: '12px' }}>
              Beeinflusst Reisegeschwindigkeit & empfohlenen Preis
            </small>
          </div>

          <div style={{ flex: 1, minWidth: '160px' }}>
            <label>Stundenpreis (€)</label>
            <input
              type="number"
              name="pricePerHour"
              value={form.pricePerHour}
              onChange={handlePriceChange}
              min="0"
              step="100"
            />
            {!priceWarning && (
              <small style={{ display: 'block', marginTop: '4px', color: '#059669', fontSize: '12px' }}>
                ✓ Marktüblicher Preis
              </small>
            )}
          </div>

          <div style={{ flex: 1, minWidth: '160px' }}>
            <label>Mindestpreis (€)</label>
            <input
              type="number"
              name="minPrice"
              value={form.minPrice}
              onChange={handleChange}
              min="0"
              step="100"
            />
          </div>
        </div>

        {/* ⚠️ PREIS-WARNUNG */}
        {priceWarning && (
          <div
            style={{
              marginTop: '12px',
              padding: '12px',
              borderRadius: '8px',
              background: priceWarning.type === 'low' ? '#fef3c7' : '#fee2e2',
              border: `1px solid ${priceWarning.type === 'low' ? '#fbbf24' : '#fca5a5'}`,
              color: priceWarning.type === 'low' ? '#92400e' : '#b91c1c',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>{priceWarning.message}</span>
          </div>
        )}

        {/* Airport Inputs */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginTop: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: '220px' }}>
            <AirportSearchInput
              label="Startflughafen"
              placeholder="z.B. Leipzig oder LEJ"
              value={form.fromIATA}
              airports={airports}
              onChange={(iata) => setForm((prev) => ({ ...prev, fromIATA: iata }))}
              required
            />
          </div>

          <div style={{ flex: 1, minWidth: '220px' }}>
            <AirportSearchInput
              label="Zielflughafen"
              placeholder="z.B. Dubai oder DXB"
              value={form.toIATA}
              airports={airports}
              onChange={(iata) => setForm((prev) => ({ ...prev, toIATA: iata }))}
              required
            />
          </div>

          <div style={{ flex: 0.7, minWidth: '140px' }}>
            <label>Passagiere</label>
            <input
              type="number"
              name="passengers"
              value={form.passengers}
              onChange={handleChange}
              min="1"
              max="20"
            />
            <small style={{ display: 'block', marginTop: '4px', color: '#6b7280', fontSize: '12px' }}>
              Ab 5 Pax: +€150 pro Person
            </small>
          </div>
        </div>

        {/* Datum und Rundflug */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginTop: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: '220px' }}>
            <label>Abflugdatum & Uhrzeit</label>
            <input
              type="datetime-local"
              name="dateTime"
              value={form.dateTime}
              onChange={handleChange}
            />
            <small style={{ display: 'block', marginTop: '4px', color: '#6b7280', fontSize: '12px' }}>
              Beeinflusst Demand-Faktoren
            </small>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '24px',
            }}
          >
            <input
              type="checkbox"
              id="sim_roundtrip"
              name="roundtrip"
              checked={form.roundtrip}
              onChange={handleChange}
            />
            <label htmlFor="sim_roundtrip">Hin- & Rückflug (~+80%)</label>
          </div>
        </div>

        <div className="form-actions" style={{ marginTop: '20px' }}>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Berechne...' : '🚀 Preis simulieren'}
          </button>
        </div>
      </form>

      {/* Fehler */}
      {error && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            borderRadius: '8px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* ✨ ERGEBNIS */}
      {result && !error && (
        <div
          style={{
            marginTop: '24px',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            background: '#ffffff',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        >
          <h3
            style={{
              margin: '0 0 16px 0',
              color: '#111827',
              fontSize: '18px',
              fontWeight: '600',
            }}
          >
            ✨ Simulierter Preis
          </h3>

          {/* Hauptinformationen */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                padding: '8px 12px',
                background: '#f3f4f6',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#374151',
              }}
            >
              📏 <strong>{result.distances.main_km.toLocaleString()}</strong> km
            </div>
            <div
              style={{
                padding: '8px 12px',
                background: '#f3f4f6',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#374151',
              }}
            >
              ⏱️ <strong>{result.timing.block_hours}</strong> h Blockzeit
            </div>
            {result.roundtrip && (
              <div
                style={{
                  padding: '8px 12px',
                  background: '#dbeafe',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#1e40af',
                  fontWeight: '600',
                }}
              >
                ↔️ Hin- & Rückflug
              </div>
            )}
          </div>

          {/* Hauptpreis */}
          <div
            style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
              borderRadius: '8px',
              marginBottom: '16px',
              border: '2px solid #10b981',
            }}
          >
            <div
              style={{
                fontSize: '14px',
                color: '#065f46',
                marginBottom: '4px',
                fontWeight: '500',
              }}
            >
              💰 Gesamtpreis
            </div>
            <div
              style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#065f46',
              }}
            >
              {formatPrice(result.price, { showBoth: true })}
            </div>
          </div>

          {/* Preisfaktoren */}
          {result.breakdown.demand_reasons &&
            result.breakdown.demand_reasons.length > 0 && (
              <div
                style={{
                  padding: '12px',
                  background: '#fef3c7',
                  borderRadius: '6px',
                  border: '1px solid #fbbf24',
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#92400e',
                    marginBottom: '6px',
                  }}
                >
                  📈 Preisfaktoren aktiv:
                </div>
                <div style={{ fontSize: '13px', color: '#78350f' }}>
                  {result.breakdown.demand_reasons.join(' • ')}
                </div>
              </div>
            )}

          {/* Breakdown Details */}
          <details style={{ marginTop: '16px' }}>
            <summary
              style={{
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                color: '#4b5563',
                padding: '8px 0',
              }}
            >
              📊 Preisaufschlüsselung anzeigen
            </summary>
            <div
              style={{
                marginTop: '12px',
                padding: '12px',
                background: '#f9fafb',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  borderBottom: '1px solid #e5e7eb',
                  color: '#374151',
                }}
              >
                <span>Flugkosten</span>
                <span style={{ fontWeight: '600' }}>
                  {formatPrice(result.breakdown.base_flight_cost)}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  borderBottom: '1px solid #e5e7eb',
                  color: '#374151',
                }}
              >
                <span>Crew-Kosten</span>
                <span style={{ fontWeight: '600' }}>
                  {formatPrice(result.breakdown.crew_cost)}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  borderBottom: '1px solid #e5e7eb',
                  color: '#374151',
                }}
              >
                <span>Landegebühren</span>
                <span style={{ fontWeight: '600' }}>
                  {formatPrice(result.breakdown.landing_fees)}
                </span>
              </div>
              {result.breakdown.passenger_fees > 0 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    borderBottom: '1px solid #e5e7eb',
                    color: '#374151',
                  }}
                >
                  <span>Passagier-Gebühren</span>
                  <span style={{ fontWeight: '600' }}>
                    {formatPrice(result.breakdown.passenger_fees)}
                  </span>
                </div>
              )}
              {result.breakdown.demand_factor > 1 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    color: '#b45309',
                  }}
                >
                  <span>Nachfrage-Faktor</span>
                  <span style={{ fontWeight: '600' }}>
                    ×{result.breakdown.demand_factor.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </details>

          {/* Info-Box */}
          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              background: '#eff6ff',
              borderRadius: '6px',
              border: '1px solid #bfdbfe',
              fontSize: '13px',
              color: '#1e40af',
              lineHeight: '1.5',
            }}
          >
            💡 <strong>Hinweis:</strong> Diese Simulation nutzt unsere Pricing
            V3 Engine. Echte Buchungen können zusätzliche Faktoren
            berücksichtigen (z.B. Positionierungskosten, spezielle
            Anforderungen).
          </div>
        </div>
      )}
    </div>
  );
}

























// ===================================================================
// HAUPTKOMPONENTE: DASHBOARD
// ===================================================================

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const { currency, setCurrency, formatPrice } = useCurrency();
  const [jets, setJets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [emptyLegs, setEmptyLegs] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingJet, setEditingJet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [airports, setAirports] = useState([]);
  const [toast, setToast] = useState(null);

    // ⛔ Falls Charterfirma noch nicht freigegeben ist: Blockscreen anzeigen
  if (profile?.role === 'charter_company' && profile?.is_approved === false) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
  <h1>Dashboard</h1>

  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
    {/* Currency Switcher */}
    <div
      style={{
        display: 'inline-flex',
        borderRadius: '999px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        fontSize: '13px',
      }}
    >
      <button
        type="button"
        onClick={() => setCurrency('EUR')}
        style={{
          padding: '6px 10px',
          border: 'none',
          cursor: 'pointer',
          background: currency === 'EUR' ? '#111827' : 'white',
          color: currency === 'EUR' ? 'white' : '#4b5563',
        }}
      >
        € EUR
      </button>
      <button
        type="button"
        onClick={() => setCurrency('USD')}
        style={{
          padding: '6px 10px',
          border: 'none',
          cursor: 'pointer',
          background: currency === 'USD' ? '#111827' : 'white',
          color: currency === 'USD' ? 'white' : '#4b5563',
        }}
      >
        $ USD
      </button>
    </div>

    <button
      onClick={() => navigate('/')}
      className="btn-secondary"
    >
      ← Zurück zur Karte
    </button>
  </div>
</div>


        <div className="dashboard-content">
          <div
            style={{
              maxWidth: '600px',
              margin: '40px auto',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid #e5e7eb',
              background: '#f9fafb',
              textAlign: 'center',
            }}
          >
            <h2 style={{ marginBottom: '12px' }}>Account in Prüfung</h2>
            <p style={{ marginBottom: '8px', color: '#4b5563' }}>
              Vielen Dank für Ihre Registrierung als Charterfirma.
            </p>
            <p style={{ marginBottom: '8px', color: '#6b7280' }}>
              Ihr JetOpti-Business-Account wurde angelegt, ist aber noch nicht freigeschaltet.
              Wir prüfen Ihre Angaben manuell und melden uns in Kürze per E-Mail.
            </p>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '16px' }}>
              Sobald Ihr Account freigegeben ist, können Sie hier Jets anlegen
              und Buchungen verwalten.
            </p>
          </div>
        </div>
      </div>
    );
  }


  // --- EmailJS Konfiguration ---
  const emailServiceId = import.meta.env.VITE_EMAIL_SERVICE || 'service_cw6x40c';
  const emailPublicKey =
    import.meta.env.VITE_EMAIL_PUBLIC_KEY || 'IxnCuOKoR-MuFZVQw';
  const templateGenerisch = 'template_d5xee9b';

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

 // Lade Flughäfen (NEU - aus Datenbank)
  useEffect(() => {
    const loadAirports = async () => {
      try {
        // Wir holen alle Flughäfen aus der DB, sortiert nach IATA
        const { data, error } = await supabase
          .from('airports')
          .select('*')
          .order('iata', { ascending: true });
          
        if (error) throw error;
        setAirports(data || []);
      } catch (err) {
        console.error('Fehler beim Laden der Flughäfen aus DB:', err);
        // Fallback falls DB leer ist:
        try {
             const response = await fetch('/airports.json');
             const fallbackData = await response.json();
             setAirports(fallbackData);
        } catch (e) { console.error('Fallback fehlgeschlagen'); }
      }
    };
    loadAirports();
  }, []);

  // Lade Jets
  useEffect(() => {
    if (!profile?.id) return;
    const loadJets = async () => {
      try {
        const { data, error } = await supabase
          .from('jets')
          .select(
            `
            *,
            company_jets!inner(company_id)
          `
          )
          .eq('company_jets.company_id', profile.id);
        if (error) throw error;
        setJets(data || []);
      } catch (err) {
        console.error('Fehler beim Laden der Jets:', err);
        showToast('Jets konnten nicht geladen werden', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadJets();
  }, [profile]);

  // Lade Buchungen
  useEffect(() => {
    if (!profile?.id) return;
    const loadBookings = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('company_id', profile.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setBookings(data || []);
      } catch (err) {
        console.error('Fehler beim Laden der Buchungen:', err);
      }
    };
    loadBookings();
  }, [profile]);

  // Lade Empty Legs
  const loadEmptyLegs = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const { data, error } = await supabase
        .from('active_empty_legs')
        .select('*')
        .eq('company_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmptyLegs(data || []);
    } catch (err) {
      console.error('Fehler beim Laden der Empty Legs:', err);
    }
  }, [profile]);

  useEffect(() => {
    if (!profile?.id) return;
    loadEmptyLegs();
    const subscription = supabase
      .channel('dashboard_empty_legs_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'empty_legs' },
        (payload) => {
          console.log(
            'Dashboard: Hot Deal (Tabelle) geändert, lade View neu.',
            payload
          );
          loadEmptyLegs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [profile, loadEmptyLegs]);

  // Jet hinzufügen
  const handleAddJet = async (jetData) => {
    try {
      let coverImageUrl = jetData.image_url;
      let galleryUrls = [];

      if (jetData.image_file) {
        const fileExt = jetData.image_file.name.split('.').pop();
        const fileName = `${profile.id}_cover_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('jet-images')
          .upload(`public/${fileName}`, jetData.image_file);
        if (uploadError) throw uploadError;
        const {
          data: { publicUrl },
        } = supabase.storage
          .from('jet-images')
          .getPublicUrl(`public/${fileName}`);
        coverImageUrl = publicUrl;
      }

      if (jetData.gallery_files && jetData.gallery_files.length > 0) {
        const uploadPromises = Array.from(jetData.gallery_files)
          .slice(0, 10)
          .map(async (file, idx) => {
            const fileExt = file.name.split('.').pop();
            const fileName = `${profile.id}_gallery_${Date.now()}_${idx}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
              .from('jet-images')
              .upload(`public/${fileName}`, file);
            if (uploadError) throw uploadError;
            const {
              data: { publicUrl },
            } = supabase.storage
              .from('jet-images')
              .getPublicUrl(`public/${fileName}`);
            return publicUrl;
          });
        galleryUrls = await Promise.all(uploadPromises);
      }

      const { data: newJet, error: jetError } = await supabase
        .from('jets')
        .insert({
          name: jetData.name,
          icao24: jetData.icao24,
          type: jetData.type,
          seats: jetData.seats,
          range: jetData.range,
          current_iata: jetData.current_iata,
          current_lat: jetData.current_lat,
          current_lng: jetData.current_lng,
          image_url: coverImageUrl,
          gallery_urls: galleryUrls.length > 0 ? galleryUrls : null,
          lead_time_hours: jetData.lead_time_hours,
          home_base_iata: jetData.home_base_iata,
          price_per_hour: jetData.price_per_hour,
          min_booking_price: jetData.min_booking_price,
          year_built: jetData.year_built,
          status: 'verfügbar',
          allow_empty_legs: jetData.allow_empty_legs,
          empty_leg_discount: jetData.empty_leg_discount,
        })
        .select()
        .single();
      if (jetError) throw jetError;

      const { error: relationError } = await supabase
        .from('company_jets')
        .insert({ company_id: profile.id, jet_id: newJet.id });
      if (relationError) throw relationError;

      setJets([...jets, newJet]);
      setShowAddModal(false);
      showToast('✅ Jet erfolgreich hinzugefügt!', 'success');
    } catch (err) {
      console.error('Fehler beim Hinzufügen:', err);
      showToast('❌ Fehler beim Hinzufügen: ' + err.message, 'error');
    }
  };

  // Jet bearbeiten
    // Jet bearbeiten
  const handleUpdateJet = async (jetData, jetId) => {
    try {
      let coverImageUrl = jetData.image_url;

      // 👇 Startpunkt: bestehende Galerie aus dem Formular
      let finalGallery = Array.isArray(jetData.existing_gallery_urls)
        ? [...jetData.existing_gallery_urls]
        : [];

      // Entfernte Bilder rausfiltern
      if (
        Array.isArray(jetData.removed_gallery_urls) &&
        jetData.removed_gallery_urls.length > 0
      ) {
        finalGallery = finalGallery.filter(
          (url) => !jetData.removed_gallery_urls.includes(url)
        );
      }

      // Cover-Bild neu hochladen (falls neues File)
      if (jetData.image_file) {
        const fileExt = jetData.image_file.name.split('.').pop();
        const fileName = `${profile.id}_cover_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('jet-images')
          .upload(`public/${fileName}`, jetData.image_file);
        if (uploadError) throw uploadError;
        const {
          data: { publicUrl },
        } = supabase.storage
          .from('jet-images')
          .getPublicUrl(`public/${fileName}`);
        coverImageUrl = publicUrl;
      }

      // Neue Galerie-Files hochladen (wie bisher)
      let newGalleryUrls = [];
      if (jetData.gallery_files && jetData.gallery_files.length > 0) {
        const uploadPromises = Array.from(jetData.gallery_files)
          .slice(0, 10)
          .map(async (file, idx) => {
            const fileExt = file.name.split('.').pop();
            const fileName = `${profile.id}_gallery_${Date.now()}_${idx}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
              .from('jet-images')
              .upload(`public/${fileName}`, file);
            if (uploadError) throw uploadError;
            const {
              data: { publicUrl },
            } = supabase.storage
              .from('jet-images')
              .getPublicUrl(`public/${fileName}`);
            return publicUrl;
          });
        newGalleryUrls = await Promise.all(uploadPromises);
      }

      // Finale Galerie: bestehende (bereinigt) + neue
      const mergedGallery = [...finalGallery, ...newGalleryUrls];

      const updateData = {
        name: jetData.name,
        icao24: jetData.icao24,
        type: jetData.type,
        seats: jetData.seats,
        range: jetData.range,
        current_iata: jetData.current_iata,
        current_lat: jetData.current_lat,
        current_lng: jetData.current_lng,
        image_url: coverImageUrl,
        lead_time_hours: jetData.lead_time_hours,
        home_base_iata: jetData.home_base_iata,
        price_per_hour: jetData.price_per_hour, // <--- NEU HINZUGEFÜGT
        min_booking_price: jetData.min_booking_price,
        year_built: jetData.year_built,
        allow_empty_legs: jetData.allow_empty_legs,
        empty_leg_discount: jetData.empty_leg_discount,
        // 👇 NEU: Galerie immer mitschicken (auch wenn leer)
        gallery_urls: mergedGallery.length > 0 ? mergedGallery : null,
      };

      const { data: updatedJet, error } = await supabase
        .from('jets')
        .update(updateData)
        .eq('id', jetId)
        .select()
        .single();
      if (error) throw error;

      setJets(jets.map((j) => (j.id === jetId ? updatedJet : j)));
      setEditingJet(null);
      showToast('✅ Jet erfolgreich aktualisiert!', 'success');
    } catch (err) {
      console.error('Fehler beim Aktualisieren:', err);
      showToast('❌ Fehler beim Aktualisieren: ' + err.message, 'error');
    }
  };


    // --- NEU: Jet schnell verschieben ---
  const handleRelocateJet = async (jet) => {
    const newIata = window.prompt(
      `Aktueller Standort von ${jet.name} ist ${jet.current_iata}.\n\nNeuen Standort (IATA-Code) eingeben:`,
      jet.current_iata
    );

    if (!newIata || newIata.toUpperCase() === (jet.current_iata || '').toUpperCase()) {
      return; // Abbruch oder keine Änderung
    }

    const newAirport = airports.find(
      (a) => a.iata.toUpperCase() === newIata.toUpperCase()
    );

    if (!newAirport) {
      alert(
        `Fehler: Flughafen "${newIata}" nicht gefunden. Bitte gültigen IATA-Code verwenden.`
      );
      return;
    }

    try {
      const { data: updatedJet, error } = await supabase
        .from('jets')
        .update({
          current_iata: newAirport.iata,
          current_lat: newAirport.lat,
          current_lng: newAirport.lon,
          status: 'verfügbar', // Sicherstellen, dass er auch verfügbar ist
        })
        .eq('id', jet.id)
        .select()
        .single();

      if (error) throw error;

      setJets(jets.map((j) => (j.id === jet.id ? updatedJet : j)));
      showToast(`✅ Jet nach ${newAirport.iata} verschoben!`, 'success');
    } catch (err) {
      console.error('Fehler beim Verschieben:', err);
      showToast(`❌ Fehler: ${err.message}`, 'error');
    }
  };

// Jet löschen
const handleDeleteJet = async (jetId) => {
  if (!window.confirm('Möchten Sie diesen Jet wirklich löschen? Dies kann nicht rückgängig gemacht werden.')) {
    return;
  }

  try {
    // Zuordnung in company_jets löschen
    const { error: relError } = await supabase
      .from('company_jets')
      .delete()
      .eq('jet_id', jetId)
      .eq('company_id', profile.id);

    if (relError) {
      console.warn('⚠️ Zuordnung company_jets konnte nicht gelöscht werden:', relError);
    }

    // Jet selbst löschen
    const { error } = await supabase
      .from('jets')
      .delete()
      .eq('id', jetId);

    if (error) throw error;

    setJets((prev) => prev.filter((j) => j.id !== jetId));
    showToast('Jet erfolgreich gelöscht.', 'info');
  } catch (err) {
    console.error('Fehler beim Löschen des Jets:', err);
    showToast(`❌ Fehler beim Löschen: ${err.message}`, 'error');
  }
};



  // Buchung akzeptieren + Empty Leg + E-Mail
  const handleAcceptBooking = async (bookingId) => {
    try {
      // 1. Finde die Buchung
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking) throw new Error('Buchung nicht gefunden');

      // 2. Finde den Jet
      const { data: jet, error: jetError } = await supabase
        .from('jets')
        .select('*')
        .eq('id', booking.jet_id)
        .single();
      if (jetError) throw jetError;

      console.log('📝 Akzeptiere Buchung:', booking);
      console.log('✈️ Jet:', jet);

      // 3. Buchung akzeptieren
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status: 'accepted' })
        .eq('id', bookingId);
      if (bookingError) throw bookingError;

      // 4. Jet-Status auf "gebucht" setzen + aktuelle Route speichern
      const { error: jetStatusError } = await supabase
        .from('jets')
        .update({
          status: 'gebucht',
          flight_from_iata: booking.from_iata || booking.from_location || null,
          flight_to_iata: booking.to_iata || booking.to_location || null,
        })
        .eq('id', booking.jet_id);

      if (jetStatusError) throw jetStatusError;
      console.log('✅ Jet-Status auf "gebucht" gesetzt');

      // 5. OPTIONAL: Empty Leg über Edge Function im Backend erzeugen
      try {
        const { data, error } = await supabase.functions.invoke(
          'create-empty-leg',
          {
            body: { bookingId }, // nur die ID; Logik bleibt im Backend
          }
        );

        if (error) {
          console.error('❌ Empty-Leg-Funktion Fehler:', error);
        } else if (data?.created) {
          console.log('✅ Empty Leg erstellt:', data.empty_leg);
          showToast('🔥 Hot Deal erstellt!', 'success');
        } else {
          console.log('ℹ️ Kein Empty Leg erstellt:', data?.reason);
        }
      } catch (fnError) {
        console.error(
          '❌ Fehler beim Aufruf von create-empty-leg:',
          fnError
        );
      }

      // --- E-MAIL LOGIK ---

      // E-Mail 3 (an KUNDE): Buchung ist bestätigt
      const kundenParamsBestaetigt = {
        recipient_email: booking.customer_email, // <-- HIER IST DER FIX
        subject: `Ihre JetOpti-Buchung (${booking.id}) wurde bestätigt!`,
        name_an: booking.customer_name,
        nachricht: `Gute Nachrichten! Ihre Buchung für die Route ${booking.from_location} → ${booking.to_location} wurde von ${profile?.company_name || 'Ihrer Charterfirma'} bestätigt. Die Charterfirma wird Sie in Kürze bezüglich der Zahlungsabwicklung kontaktieren.`,
        route: `${booking.from_location} → ${booking.to_location}`,
        jet_name: booking.jet_name,
        departure_date: new Date(booking.departure_date).toLocaleString('de-DE'),
        customer_name: booking.customer_name,
        customer_email: booking.customer_email,
        customer_phone: booking.customer_phone || 'N/A',
        total_price: booking.total_price.toLocaleString(),
        booking_id: booking.id,
      };

      try {
        await emailjs.send(
          emailServiceId,
          templateGenerisch,
          kundenParamsBestaetigt,
          emailPublicKey
        );
        console.log('✅ E-Mail "Buchung Bestätigt" an Kunden gesendet');
      } catch (emailError) {
        console.warn(
          '⚠️ E-Mail (Bestätigung-Kunde) konnte nicht gesendet werden:',
          emailError
        );
      }

      // E-Mail 4 (an CHARTER): Kundendaten für externe Zahlung
      const charterParams = {
        recipient_email:
          profile?.booking_notification_email || profile?.email, // <-- HIER IST DER FIX
        subject: `Akzeptierte Buchung (${booking.id}): ${booking.from_location} → ${booking.to_location}`,
        name_an: profile?.company_name || 'Team',
        nachricht: `Sie haben die Buchung (ID: ${booking.id}) akzeptiert und der Kunde wurde benachrichtigt. Bitte kontaktieren Sie den Kunden nun bezüglich der Zahlungsabwicklung:`,
        route: `${booking.from_location} → ${booking.to_location}`,
        jet_name: booking.jet_name,
        departure_date: new Date(booking.departure_date).toLocaleString('de-DE'),
        customer_name: booking.customer_name,
        customer_email: booking.customer_email,
        customer_phone: booking.customer_phone || 'Nicht angegeben',
        total_price: booking.total_price.toLocaleString(),
        booking_id: booking.id,
      };

      try {
        await emailjs.send(
          emailServiceId,
          templateGenerisch,
          charterParams,
          emailPublicKey
        );
        console.log('✅ Kontaktdaten-E-Mail an Charterfirma gesendet');
      } catch (emailError) {
        console.warn(
          '⚠️ E-Mail an Charterfirma konnte nicht gesendet werden:',
          emailError
        );
      }
      // --- ENDE E-MAIL LOGIK ---

      await loadEmptyLegs();

      setBookings(
        bookings.map((b) =>
          b.id === bookingId ? { ...b, status: 'accepted' } : b
        )
      );
      showToast('✅ Buchung akzeptiert!', 'success');
    } catch (err) {
      console.error('❌ Fehler:', err);
      showToast(`❌ Fehler: ${err.message}`, 'error');
    }
  };


  // Buchung ablehnen
  const handleRejectBooking = async (bookingId) => {
    const reason = window.prompt('Grund für Ablehnung (optional):');
    try {
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking) throw new Error('Buchung nicht gefunden');

      const { error } = await supabase
        .from('bookings')
        .update({ status: 'rejected', rejection_reason: reason })
        .eq('id', bookingId);
      if (error) throw error;

      const { error: jetStatusError } = await supabase
        .from('jets')
        .update({ status: 'verfügbar' })
        .eq('id', booking.jet_id);
      if (jetStatusError)
        console.warn(
          '⚠️ Jet-Status konnte nicht zurückgesetzt werden:',
          jetStatusError
        );
      else console.log('✅ Jet-Status zurück auf "verfügbar" gesetzt');

      setBookings(
        bookings.map((b) =>
          b.id === bookingId ? { ...b, status: 'rejected' } : b
        )
      );
      showToast('❌ Buchung abgelehnt', 'info');
    } catch (err) {
      console.error('Fehler:', err);
      showToast('❌ Fehler beim Ablehnen', 'error');
    }
  };

  // Complete Booking Handler (JETZT MIT POSITIONS-UPDATE)
  const handleCompleteBooking = async (bookingId) => {
    if (!window.confirm('Soll dieser Flug als "Abgeschlossen" markiert werden?')) return;
    try {
      // 1. Finde die Buchung
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) throw new Error('Buchung nicht gefunden');

      // --- NEU: Finde den Zielflughafen ---
      const destAirport = airports.find(a => a.iata === booking.to_iata);
      if (!destAirport) {
        console.warn(`Zielflughafen ${booking.to_iata} nicht in airports.json gefunden. Jet-Position wird nicht aktualisiert.`);
      }
      // --- ENDE NEU ---

      // 2. Buchung abschließen
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', bookingId);
      if (error) throw error;
      
      // 3. ✨ Jet-Status UND Position zurücksetzen
            const jetUpdateData = { 
        status: 'verfügbar',
        flight_from_iata: null,
        flight_to_iata: null,
      };


if (destAirport) {
  jetUpdateData.current_iata = destAirport.iata;
  jetUpdateData.current_lat = destAirport.lat;
  jetUpdateData.current_lng = destAirport.lon;
}

      
      const { error: jetStatusError } = await supabase
        .from('jets')
        .update(jetUpdateData)
        .eq('id', booking.jet_id);
      
      if (jetStatusError) console.warn('⚠️ Jet-Status/Position konnte nicht zurückgesetzt werden:', jetStatusError);
      else console.log(`✅ Jet-Status auf "verfügbar" gesetzt am neuen Standort ${destAirport ? destAirport.iata : ''}`);
      
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: 'completed' } : b));
      showToast('✅ Buchung abgeschlossen!', 'success');
    } catch (err) {
      console.error('Fehler:', err);
      showToast('❌ Fehler beim Abschließen', 'error');
    }
  };

  // Storno-Funktion
  const handleCancelBooking = async (bookingId) => {
    if (
      !window.confirm(
        'Möchten Sie diese akzeptierte Buchung stornieren?\n\nDer Jet wird wieder als "verfügbar" markiert und der zugehörige Hot Deal (falls vorhanden) wird deaktiviert.'
      )
    )
      return;

    try {
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking) throw new Error('Buchung nicht gefunden');

      console.log('[STORNO] Storniere Buchung:', booking.id);

      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);
      if (bookingError) throw bookingError;

      console.log('[OK] Buchung auf "cancelled" gesetzt');

          const { error: jetError } = await supabase
        .from('jets')
        .update({
          status: 'verfügbar',
          flight_from_iata: null,
          flight_to_iata: null,
        })
        .eq('id', booking.jet_id);

      if (jetError) throw jetError;

      console.log('[OK] Jet zurück auf "verfügbar" gesetzt');

      const { error: legError } = await supabase
        .from('empty_legs')
        .update({ is_active: false })
        .eq('jet_id', booking.jet_id)
        .eq('is_active', true);

      if (legError)
        console.warn(
          '[WARN] Hot Deal konnte nicht deaktiviert werden:',
          legError
        );
      else console.log('[OK] Zugehöriger Hot Deal deaktiviert');

            // --- NEU: Storno-E-Mail an Kunden senden ---
      try {
        const kundenParamsStorno = {
          recipient_email: booking.customer_email, // <-- HIER IST DER FIX
          subject: `Ihre JetOpti-Buchung (${booking.id}) wurde storniert`,
          name_an: booking.customer_name,
          nachricht: `Leider musste Ihre Buchung (ID: ${booking.id}) für die Route ${booking.from_location} → ${booking.to_location} von der Charterfirma storniert werden. Der Jet ist nun wieder freigegeben.`,
          // Sende Rest-Variablen, falls die Vorlage sie braucht
          route: `${booking.from_location} → ${booking.to_location}`,
          jet_name: booking.jet_name,
          departure_date: new Date(booking.departure_date).toLocaleString('de-DE'),
          customer_name: booking.customer_name,
          customer_email: booking.customer_email,
          customer_phone: booking.customer_phone || 'N/A',
          total_price: booking.total_price.toLocaleString(),
          booking_id: booking.id
        };
        await emailjs.send(emailServiceId, templateGenerisch, kundenParamsStorno, emailPublicKey);
        console.log('✅ Storno-E-Mail an Kunden gesendet');
      } catch (emailError) {
        console.warn("⚠️ Storno-E-Mail an Kunden konnte nicht gesendet werden:", emailError);
      }
      // --- ENDE NEUER BLOCK ---

      // State updaten
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
// ... rest der Funktion

      setBookings(
        bookings.map((b) =>
          b.id === bookingId ? { ...b, status: 'cancelled' } : b
        )
      );
      showToast('Buchung storniert. Der Jet ist wieder verfügbar.', 'info');
    } catch (err) {
      console.error('Fehler beim Stornieren:', err);
      showToast(`❌ Fehler beim Stornieren: ${err.message}`, 'error');
    }
  };

  // Empty Leg abschließen
  const handleCompleteEmptyLeg = async (emptyLegId) => {
    if (
      !window.confirm(
        'Soll dieser Hot Deal als "Abgeschlossen" markiert werden?\n\nDer Jet wird wieder als verfügbar markiert.'
      )
    )
      return;

    try {
      const emptyLeg = emptyLegs.find((el) => el.id === emptyLegId);
      if (!emptyLeg) throw new Error('Hot Deal nicht gefunden');

      console.log(
        '[HOT-DEAL] Schliesse ab:',
        emptyLeg.from_iata,
        '->',
        emptyLeg.to_iata
      );

      const { error: emptyLegError } = await supabase
        .from('empty_legs')
        .update({ is_active: false })
        .eq('id', emptyLegId);

      if (emptyLegError) {
        console.error('[ERROR] Empty Leg Update fehlgeschlagen:', emptyLegError);
        throw emptyLegError;
      }

      console.log('[OK] Empty Leg deaktiviert');

      const { error: jetError } = await supabase
        .from('jets')
        .update({ status: 'verfügbar' })
        .eq('id', emptyLeg.jet_id);

      if (jetError) {
        console.error('[ERROR] Jet Update fehlgeschlagen:', jetError);
        throw jetError;
      }

      console.log('[OK] Jet zurück auf verfügbar');

      setEmptyLegs((prev) => prev.filter((el) => el.id !== emptyLegId));

      const { data: updatedLegs, error: reloadError } = await supabase
        .from('active_empty_legs')
        .select('*')
        .eq('company_id', profile.id);

      if (!reloadError && updatedLegs) {
        setEmptyLegs(updatedLegs);
        console.log('[OK] Hot Deals neu geladen:', updatedLegs.length, 'aktiv');
      }

      const { data: updatedJets, error: jetsError } = await supabase
        .from('jets')
        .select('*, company_jets!inner(company_id)')
        .eq('company_jets.company_id', profile.id);

      if (!jetsError && updatedJets) {
        setJets(updatedJets);
        console.log('[OK] Jets neu geladen');
      }

      showToast('✅ Hot Deal abgeschlossen!', 'success');
      console.log('[OK] Hot Deal Abschluss komplett');
    } catch (err) {
      console.error('[ERROR] Fehler beim Abschliessen:', err);
      showToast(`❌ Fehler: ${err.message}`, 'error');
    }
  };

  // Stats berechnen
  const stats = useMemo(
    () => ({
      totalJets: jets.length,
      revenue: bookings
        .filter((b) => b.status === 'completed')
        .reduce((sum, b) => sum + (b.total_price || 0), 0),
      availableJets: jets.filter((j) => j.status === 'verfügbar').length,
      pendingBookings: bookings.filter((b) => b.status === 'pending').length,
      completedBookings: bookings.filter((b) => b.status === 'completed')
        .length,
      activeEmptyLegs: emptyLegs.filter((el) => el.is_active).length,
    }),
    [jets, bookings, emptyLegs]
  );

  // Tabs definieren
  const tabs = [
    { id: 'overview', label: 'Übersicht', icon: '📊' },
    { id: 'jets', label: 'Jets', icon: '✈️', badge: stats.totalJets },
    {
      id: 'bookings',
      label: 'Buchungen',
      icon: '📋',
      badge: stats.pendingBookings,
    },
    {
      id: 'empty-legs',
      label: 'Hot Deals',
      icon: '🔥',
      badge: stats.activeEmptyLegs,
    },
    { id: 'simulator', label: 'Preis-Simulator', icon: '🧮' },
    { id: 'profile', label: 'Profil', icon: '👤' },
  ];

  if (loading)
    return <div className="dashboard-loading">Lade Dashboard...</div>;
    if (profile?.role === 'charter' && profile?.is_approved === false) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Dashboard (gesperrt)</h1>
        </div>
        <div
          style={{
            maxWidth: '600px',
            marginTop: '24px',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #fbbf24',
            background: '#fffbeb',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Ihr Account wird geprüft</h2>
          <p style={{ lineHeight: 1.6 }}>
            Vielen Dank für Ihre Registrierung als Charterfirma bei JetOpti.
            <br />
            Ihr Konto wurde erfolgreich angelegt und wird nun manuell
            freigegeben. Sobald die Prüfung abgeschlossen ist, erhalten Sie eine
            Bestätigung per E-Mail und können dieses Dashboard vollständig
            nutzen.
          </p>
          <p style={{ marginTop: '12px', color: '#6b7280', fontSize: '0.9rem' }}>
            Falls Sie Rückfragen haben, kontaktieren Sie bitte den JetOpti
            Support.
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <button
          onClick={() => navigate(MAP_ROUTE)}
          className="btn-secondary"
        >
          ← Zurück zur Karte
        </button>
      </div>

      <TabNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="dashboard-content">
        {/* ÜBERSICHT */}
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">✈️</div>
                <div className="stat-info">
                  <p className="stat-label">Gesamt Jets</p>
                  <p className="stat-value">{stats.totalJets}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <p className="stat-label">Verfügbar</p>
                  <p className="stat-value">{stats.availableJets}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-info">
                  <p className="stat-label">Offene Anfragen</p>
                  <p className="stat-value">{stats.pendingBookings}</p>
                </div>
              </div>

              <div className="stat-card">
  <div className="stat-icon">💰</div>
  <div className="stat-info">
    <p className="stat-label">Umsatz (Gesamt)</p>
    <p
      className="stat-value"
      style={{ fontSize: '0.8rem', lineHeight: 1.3 }}
    >
      {formatPrice(stats.revenue, { showBoth: true })}
    </p>
  </div>
</div>



              <div className="stat-card">
                <div className="stat-icon">🎉</div>
                <div className="stat-info">
                  <p className="stat-label">Abgeschlossen</p>
                  <p className="stat-value">{stats.completedBookings}</p>
                </div>
              </div>

              <div className="stat-card stat-card-hot-deals">
                <div className="stat-icon">🔥</div>
                <div className="stat-info">
                  <p className="stat-label">Aktive Hot Deals</p>
                  <p className="stat-value">{stats.activeEmptyLegs}</p>
                </div>
              </div>
            </div>

            {/* Stripe Teaser Info-Box */}
            <div
              style={{
                background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
                border: '2px solid #c084fc',
                borderRadius: '12px',
                padding: '20px',
                marginTop: '24px',
              }}
            >
              <h3
                style={{
                  margin: '0 0 12px 0',
                  color: '#581c87',
                }}
              >
                🚀 Bald verfügbar: JetOpti Premium
              </h3>
              <p
                style={{
                  margin: 0,
                  color: '#5b21b6',
                  lineHeight: '1.6',
                }}
              >
                Genervt vom manuellen Bestätigen und der externen
                Rechnungsstellung? Mit unserem kommenden Stripe Connect-Upgrade
                (Phase 2) werden Ihre Buchungen vollautomatisch akzeptiert und
                bezahlt – ohne einen Klick.
              </p>
            </div>
          </div>
        )}

        {/* JETS TAB */}
        {activeTab === 'jets' && (
          <div className="jets-section">
            <div className="section-header">
              <h2>Meine Jets</h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary"
              >
                + Neuen Jet hinzufügen
              </button>
            </div>
            <div className="jets-grid">
              {jets.map((jet) => (
                <div key={jet.id} className="jet-card">
                  <img
                    src={jet.image_url || '/jets/default.jpg'}
                    alt={jet.name}
                  />
                  <div className="jet-card-content">
                    <h3>{jet.name}</h3>
                    <p className="jet-type">{jet.type}</p>
                    <div className="jet-details">
                      <span>🪑 {jet.seats} Sitze</span>
                      <span>📏 {jet.range} km</span>
                      <span>⏱️ {jet.lead_time_hours}h</span>
                    </div>
                    {jet.allow_empty_legs && (
                      <div
                        style={{
                          marginTop: '8px',
                          padding: '6px 12px',
                          background: '#fee2e2',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#991b1b',
                        }}
                      >
                        🔥 Hot Deals: -{jet.empty_leg_discount}%
                      </div>
                    )}
                      <div className="jet-card-actions">
                      <button
                        onClick={() => setEditingJet(jet)}
                        className="btn-edit"
                      >
                        ✏️ Bearbeiten
                      </button>
                      <button
                        onClick={() => handleRelocateJet(jet)}
                        className="btn-relocate"
                      >
                        📍 Position ändern
                      </button>
                      <button
                        onClick={() => handleDeleteJet(jet.id)}
                        className="btn-delete"
                      >
                        🗑️ Löschen
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BUCHUNGEN TAB */}
        {activeTab === 'bookings' && (
          <div className="bookings-section">
            <h2>Buchungsanfragen</h2>
            {bookings.length === 0 ? (
              <p>Keine Buchungen vorhanden.</p>
            ) : (
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Kunde</th>
                    <th>Jet</th>
                    <th>Route</th>
                    <th>Datum</th>
                    <th>Preis</th>
                    <th>Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>
                        <span
                          className={`status-badge status-${booking.status}`}
                        >
                          {booking.status === 'pending' && '⏳ Ausstehend'}
                          {booking.status === 'accepted' && '✅ Akzeptiert'}
                          {booking.status === 'rejected' && '❌ Abgelehnt'}
                          {booking.status === 'completed' && '🎉 Abgeschlossen'}
                          {booking.status === 'cancelled' && '🚫 Storniert'}
                        </span>
                      </td>
                      <td>{booking.customer_name}</td>
                      <td>{booking.jet_name}</td>
                      <td>
                        {booking.from_location} → {booking.to_location}
                      </td>
                      <td>
                        {new Date(
                          booking.departure_date
                        ).toLocaleDateString('de-DE')}
                      </td>
                      <td>
  {formatPrice(booking.total_price, { showBoth: true })}
</td>
                      <td>
                        {booking.status === 'pending' && (
                          <div className="booking-actions">
                            <button
                              onClick={() => handleAcceptBooking(booking.id)}
                              className="btn-accept"
                            >
                              ✅ Akzeptieren
                            </button>
                            <button
                              onClick={() => handleRejectBooking(booking.id)}
                              className="btn-reject"
                            >
                              ❌ Ablehnen
                            </button>
                          </div>
                        )}

                        {booking.status === 'accepted' && (
                          <div className="booking-actions">
                            <button
                              onClick={() =>
                                handleCompleteBooking(booking.id)
                              }
                              className="btn-complete"
                            >
                              ✨ Abgeschlossen
                            </button>
                            <button
                              onClick={() =>
                                handleCancelBooking(booking.id)
                              }
                              className="btn-reject"
                              style={{ marginLeft: '8px' }}
                            >
                              🚫 Stornieren
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* EMPTY LEGS TAB */}
        {activeTab === 'empty-legs' && (
          <div className="empty-legs-section">
            <h2>🔥 Meine Hot Deals / Empty Legs</h2>

            <div
              style={{
                background: '#fef2f2',
                border: '2px solid #fecaca',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px',
              }}
            >
              <h3
                style={{
                  margin: '0 0 12px 0',
                  color: '#991b1b',
                }}
              >
                ℹ️ Wie funktioniert&apos;s?
              </h3>
              <p
                style={{
                  margin: 0,
                  color: '#7f1d1d',
                  lineHeight: '1.6',
                }}
              >
                Wenn ein Kunde über AI Jet Match einen Ihrer Jets bucht und
                dieser zum Startflughafen fliegen muss, wird dieser Leerflug
                automatisch als &quot;Hot Deal&quot; mit Ihrem konfigurierten
                Rabatt angeboten.
              </p>
            </div>

            {emptyLegs.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: '#9ca3af',
                }}
              >
                <div
                  style={{
                    fontSize: '48px',
                    marginBottom: '16px',
                  }}
                >
                  🔥
                </div>
                <p>Noch keine Empty Legs vorhanden.</p>
                <small>
                  Empty Legs werden automatisch erstellt, wenn Kunden über AI
                  Jet Match buchen.
                </small>
              </div>
            ) : (
              <div className="empty-legs-grid">
                {emptyLegs.map((leg) => (
                  <div key={leg.id} className="empty-leg-card">
                    <div className="empty-leg-header">
                      <span
                        className={`status-badge ${
                          leg.is_active ? 'status-active' : 'status-inactive'
                        }`}
                      >
                        {leg.is_active ? '🔥 Aktiv' : '⏸️ Inaktiv'}
                      </span>
                      <span
                        style={{
                          fontSize: '20px',
                          fontWeight: '700',
                          color: '#ef4444',
                        }}
                      >
                        -{leg.discount}%
                      </span>
                    </div>

                    <h3
                      style={{
                        margin: '12px 0 8px 0',
                        fontSize: '18px',
                      }}
                    >
                      {leg.from_iata} → {leg.to_iata}
                    </h3>

                    <p
                      style={{
                        margin: '0 0 12px 0',
                        color: '#6b7280',
                        fontSize: '14px',
                      }}
                    >
                      {leg.jets?.name || leg.jet_name} •{' '}
                      {leg.jets?.type || leg.jet_type}
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '12px',
                      }}
                    >
                      <div>
                        <div
  style={{
    textDecoration: 'line-through',
    color: '#9ca3af',
    fontSize: '14px',
  }}
>
  {formatPrice(leg.normal_price, { showBoth: true })}
</div>
<div
  style={{
    fontSize: '20px',
    fontWeight: '700',
    color: '#ef4444',
  }}
>
  {formatPrice(leg.discounted_price, { showBoth: true })}
</div>

                      </div>
                      <div
                        style={{
                          textAlign: 'right',
                          fontSize: '12px',
                          color: '#6b7280',
                        }}
                      >
                        Verfügbar bis:
                        <br />
                        {new Date(leg.available_until).toLocaleString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    {leg.reason && (
                      <p
                        style={{
                          marginTop: '12px',
                          padding: '8px',
                          background: '#f3f4f6',
                          borderRadius: '6px',
                          fontSize: '12px',
                          color: '#6b7280',
                        }}
                      >
                        💬 {leg.reason}
                      </p>
                    )}

                    {leg.is_active && (
                      <button
                        onClick={() => handleCompleteEmptyLeg(leg.id)}
                        style={{
                          marginTop: '16px',
                          width: '100%',
                          padding: '12px',
                          background:
                            'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '14px',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) =>
                          (e.target.style.transform = 'translateY(-2px)')
                        }
                        onMouseLeave={(e) =>
                          (e.target.style.transform = 'translateY(0)')
                        }
                      >
                        ✅ Hot Deal abschließen
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

                {/* PREIS-SIMULATOR TAB */}
        {activeTab === 'simulator' && (
          <div className="simulator-section">
            <PriceSimulator airports={airports} />
          </div>
        )}


               {/* PROFIL TAB (JETZT BEARBEITBAR) */}
        {activeTab === 'profile' && (
          <ProfileEditor 
            profile={profile} 
            onSave={async (updatedProfile) => {
              setLoading(true);
              const { error } = await supabase
                .from('profiles')
                .update(updatedProfile)
                .eq('id', profile.id);
              
              if (error) {
                showToast(`Fehler beim Speichern: ${error.message}`, 'error');
              } else {
                showToast('Profil erfolgreich gespeichert!', 'success');
                // Optional: Profil-State in useAuth aktualisieren, falls nötig
              }
              setLoading(false);
            }} 
          />
        )}
      </div>

      {/* MODALS */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <JetForm
              onSubmit={handleAddJet}
              onCancel={() => setShowAddModal(false)}
              airports={airports}
            />
          </div>
        </div>
      )}

      {editingJet && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <JetForm
              initialData={editingJet}
              onSubmit={handleUpdateJet}
              onCancel={() => setEditingJet(null)}
              airports={airports}
            />
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

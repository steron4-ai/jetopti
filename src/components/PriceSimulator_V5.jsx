// --- PREIS-SIMULATOR V5 - Mit Leerflug-Berechnung für Charterfirmen ---
// Features: 
// - Toggle für "Leerflug berücksichtigen"
// - Aktuelle Jet-Position (conditional)
// - Ferry + Main Flight Berechnung
// - Breakdown mit separaten Kosten
// - Coca-Cola-Rezept: Keine sensiblen Berechnungsdetails!

import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useCurrency } from '../lib/CurrencyContext';
import AirportSearchInput from '../components/AirportSearchInput';

function PriceSimulatorV5({ airports }) {
  const { formatPrice } = useCurrency();

  // ✨ REALISTISCHE MARKTPREISE
  const JET_TYPE_DEFAULTS = {
    'Very Light Jet': { hourlyRate: 3000, minPrice: 4000 },
    'Light Jet': { hourlyRate: 4500, minPrice: 5000 },
    'Super Light Jet': { hourlyRate: 5000, minPrice: 6000 },
    'Midsize Jet': { hourlyRate: 6000, minPrice: 7000 },
    'Super Midsize Jet': { hourlyRate: 7500, minPrice: 9000 },
    'Heavy Jet': { hourlyRate: 9500, minPrice: 12000 },
    'Ultra Long Range': { hourlyRate: 12000, minPrice: 15000 },
  };

  // 🔍 VALIDIERUNGSBEREICHE
  const getValidationRange = (jetType) => {
    const defaults = JET_TYPE_DEFAULTS[jetType];
    return {
      minRealistic: Math.round(defaults.hourlyRate * 0.6),
      maxRealistic: Math.round(defaults.hourlyRate * 1.4),
      recommended: defaults.hourlyRate,
    };
  };

  const [form, setForm] = useState({
    jetType: 'Light Jet',
    pricePerHour: 4500,
    minPrice: 5000,
    
    // 🆕 FERRY-OPTIONEN
    includeFerry: false,
    currentPosition: '',
    
    // KUNDENFLUG
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

  // 🔄 JET-TYP ÄNDERUNG
  const handleJetTypeChange = (e) => {
    const newJetType = e.target.value;
    const defaults = JET_TYPE_DEFAULTS[newJetType];

    setForm((prev) => ({
      ...prev,
      jetType: newJetType,
      pricePerHour: defaults.hourlyRate,
      minPrice: defaults.minPrice,
    }));

    setPriceWarning(null);
  };

  // 📝 PREIS-ÄNDERUNG
  const handlePriceChange = (e) => {
    const newPrice = Number(e.target.value);
    
    setForm((prev) => ({
      ...prev,
      pricePerHour: newPrice,
    }));

    const warning = validatePrice(form.jetType, newPrice);
    setPriceWarning(warning);
  };

  // 📝 ANDERE FELDER
  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // 🚀 SUBMIT
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

      if (form.includeFerry && !form.currentPosition) {
        throw new Error('Bitte aktuelle Jet-Position angeben');
      }

      if (form.includeFerry && form.currentPosition === form.fromIATA) {
        throw new Error('Jet steht bereits am Startflughafen - kein Leerflug nötig');
      }

      if (form.pricePerHour <= 0) {
        throw new Error('Stundenpreis muss größer als 0 sein');
      }

      console.log('🧮 Simulator V5 - Mode:', form.includeFerry ? 'Mit Ferry' : 'Ohne Ferry');

      if (form.includeFerry) {
        // 🔥 MIT FERRY: Nutze ai-jet-match Style Berechnung
        console.log('✈️ Berechne Ferry:', form.currentPosition, '→', form.fromIATA);
        console.log('✈️ Berechne Main:', form.fromIATA, '→', form.toIATA);
        
        const { data, error: functionError } = await supabase.functions.invoke(
          'simulate-price',
          {
            body: {
              jetType: form.jetType,
              pricePerHour: Number(form.pricePerHour),
              minPrice: Number(form.minPrice),
              
              // 🆕 Ferry-Daten
              includeFerry: true,
              ferryFrom: form.currentPosition,
              ferryTo: form.fromIATA,
              
              // Kundenflug-Daten
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

        console.log('✅ Simulationsergebnis (mit Ferry):', data);
        setResult(data);
      } else {
        // 📦 OHNE FERRY: Standard simulate-price
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

        console.log('✅ Simulationsergebnis (ohne Ferry):', data);
        setResult(data);
      }
    } catch (err) {
      console.error('Simulator-Fehler:', err);
      setError(err.message || 'Fehler bei der Simulation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="price-simulator">
      <h2>🧮 Preis-Simulator V5</h2>
      <p style={{ color: '#6b7280', marginBottom: '16px' }}>
        Testen Sie verschiedene Routen und Jet-Typen - jetzt mit Leerflug-Berechnung!
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
            }}
          >
            {priceWarning.message}
          </div>
        )}

        {/* 🆕 FERRY-TOGGLE */}
        <div
          style={{
            marginTop: '20px',
            padding: '16px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            border: '2px solid #fbbf24',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <input
              type="checkbox"
              id="includeFerry"
              name="includeFerry"
              checked={form.includeFerry}
              onChange={handleChange}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
            <label 
              htmlFor="includeFerry"
              style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: '#92400e',
                cursor: 'pointer',
                margin: 0,
              }}
            >
              ✈️ Leerflug berücksichtigen (Erweitert)
            </label>
          </div>
          
          <div style={{ fontSize: '13px', color: '#92400e', marginLeft: '32px' }}>
            💡 Aktivieren Sie diese Option um zu testen, wie sich Positionierungsflüge auf den Gesamtpreis auswirken.
          </div>
        </div>

        {/* 🆕 AKTUELLE JET-POSITION (nur wenn Toggle AN) */}
        {form.includeFerry && (
          <div
            style={{
              marginTop: '16px',
              padding: '16px',
              borderRadius: '8px',
              background: '#f0fdf4',
              border: '1px solid #86efac',
            }}
          >
            <AirportSearchInput
              label="📍 Aktuelle Jet-Position"
              placeholder="z.B. Prague (PRG)"
              value={form.currentPosition}
              airports={airports}
              onChange={(iata) => setForm((prev) => ({ ...prev, currentPosition: iata }))}
              required={form.includeFerry}
            />
            <small style={{ display: 'block', marginTop: '8px', color: '#15803d', fontSize: '12px' }}>
              💡 Von hier fliegt der Jet leer zum Startflughafen des Kundenauftrags
            </small>
          </div>
        )}

        {/* 🎯 KUNDENFLUG-SECTION */}
        <div
          style={{
            marginTop: '20px',
            padding: '16px',
            borderRadius: '8px',
            background: form.includeFerry ? '#eff6ff' : 'transparent',
            border: form.includeFerry ? '1px solid #93c5fd' : 'none',
          }}
        >
          {form.includeFerry && (
            <h4 style={{ margin: '0 0 12px 0', color: '#1e40af', fontSize: '14px', fontWeight: '600' }}>
              🎯 Kundenauftrag
            </h4>
          )}

          {/* Airport Inputs */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
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
          <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <label>Abflugdatum & Uhrzeit</label>
              <input
                type="datetime-local"
                name="dateTime"
                value={form.dateTime}
                onChange={handleChange}
              />
              <small style={{ display: 'block', marginTop: '4px', color: '#6b7280', fontSize: '12px' }}>
                Beeinflusst Nachfrage-Faktoren
              </small>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
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
          <h3 style={{ margin: '0 0 16px 0', color: '#111827', fontSize: '18px', fontWeight: '600' }}>
            ✨ Simulierter Preis
          </h3>

          {/* 🆕 FERRY-BREAKDOWN (wenn inkludiert) */}
          {result.ferry && (
            <div
              style={{
                marginBottom: '20px',
                padding: '16px',
                borderRadius: '8px',
                background: '#fef3c7',
                border: '1px solid #fbbf24',
              }}
            >
              <h4 style={{ margin: '0 0 12px 0', color: '#92400e', fontSize: '15px', fontWeight: '600' }}>
                🛫 Leerflug (Positionierung)
              </h4>
              
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <div style={{ padding: '6px 10px', background: 'white', borderRadius: '6px', fontSize: '13px' }}>
                  📏 <strong>{result.ferry.distance_km.toLocaleString()}</strong> km
                </div>
                <div style={{ padding: '6px 10px', background: 'white', borderRadius: '6px', fontSize: '13px' }}>
                  ⏱️ <strong>{result.ferry.block_hours}</strong> h
                </div>
              </div>

              <div style={{ fontSize: '20px', fontWeight: '700', color: '#92400e' }}>
                {formatPrice(result.ferry.price)}
              </div>
              <small style={{ color: '#92400e', fontSize: '12px' }}>
                Positionierungskosten
              </small>
            </div>
          )}

          {/* 🎯 KUNDENFLUG-BREAKDOWN */}
          <div
            style={{
              marginBottom: '16px',
              padding: '16px',
              borderRadius: '8px',
              background: result.ferry ? '#eff6ff' : '#f3f4f6',
              border: result.ferry ? '1px solid #93c5fd' : '1px solid #d1d5db',
            }}
          >
            <h4 style={{ margin: '0 0 12px 0', color: result.ferry ? '#1e40af' : '#374151', fontSize: '15px', fontWeight: '600' }}>
              {result.ferry ? '🎯 Kundenflug' : '✈️ Flug'}
            </h4>
            
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <div style={{ padding: '6px 10px', background: 'white', borderRadius: '6px', fontSize: '13px' }}>
                📏 <strong>{result.distances.main_km.toLocaleString()}</strong> km
              </div>
              <div style={{ padding: '6px 10px', background: 'white', borderRadius: '6px', fontSize: '13px' }}>
                ⏱️ <strong>{result.timing.block_hours}</strong> h
              </div>
              {result.roundtrip && (
                <div style={{ padding: '6px 10px', background: '#dbeafe', borderRadius: '6px', fontSize: '13px', fontWeight: '600', color: '#1e40af' }}>
                  ↔️ Hin- & Rückflug
                </div>
              )}
            </div>

            <div style={{ fontSize: '20px', fontWeight: '700', color: result.ferry ? '#1e40af' : '#111827' }}>
              {formatPrice(result.mainFlightPrice || result.totalPrice)}
            </div>
            <small style={{ color: '#6b7280', fontSize: '12px' }}>
              Kundenauftrag
            </small>
          </div>

          {/* 💰 GESAMTPREIS */}
          <div
            style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
              borderRadius: '8px',
              marginBottom: result.ferry ? '16px' : '0',
            }}
          >
            <div style={{ fontSize: '14px', color: '#065f46', marginBottom: '4px', fontWeight: '600' }}>
              💰 Gesamtpreis
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#059669', marginBottom: '4px' }}>
              {formatPrice(result.totalPrice)}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>
              ≈ {formatPrice(result.totalPrice, 'USD')}
            </div>
          </div>

          {/* 🆕 VERGLEICH (nur wenn Ferry aktiv) */}
          {result.ferry && result.comparison && (
            <div
              style={{
                padding: '12px',
                borderRadius: '8px',
                background: '#f0fdf4',
                border: '1px solid #86efac',
              }}
            >
              <div style={{ fontSize: '13px', color: '#15803d' }}>
                💡 <strong>Mit Leerflug:</strong> {result.comparison.percent_increase}% teurer
                <br />
                <small>
                  Ohne Positionierung: {formatPrice(result.comparison.without_ferry)} | 
                  Differenz: +{formatPrice(result.comparison.ferry_cost)}
                </small>
              </div>
            </div>
          )}

          {/* 📊 COCA-COLA-REZEPT: Keine Details, nur Summen! */}
          {/* Keine Demand-Faktoren, keine Formeln, keine Berechnungsdetails */}
        </div>
      )}
    </div>
  );
}

export default PriceSimulatorV5;

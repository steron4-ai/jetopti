// src/components/CommissionComponents.jsx
// ✅ Alle Komponenten für Provisionsmodell & Manuelle Hot Deals
// Komponenten: AgreementSetup, CommissionTab, ManualHotDealModal, HotDealsTabExtended

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import AirportSearchInput from './AirportSearchInput';
import { useCurrency } from '../lib/CurrencyContext';

// ============================================================================
// 1. AGREEMENT SETUP - Vertrag abschließen beim Onboarding
// ============================================================================

export function AgreementSetup({ onSuccess }) {
  const [selectedTier, setSelectedTier] = useState('silver');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const tiers = [
    {
      id: 'bronze',
      name: 'BRONZE',
      rate: '6%',
      color: '#cd7f32',
      features: [
        'Plattform-Nutzung',
        'Jet-Verwaltung',
        'Direkter Kundenkontakt',
        'Basic Support',
      ],
    },
    {
      id: 'silver',
      name: 'SILVER',
      rate: '8%',
      color: '#c0c0c0',
      recommended: true,
      features: [
        'Alles von Bronze',
        'Lead-Generierung',
        'Email-Support',
        'Payment Processing',
        'Monatliche Abrechnungen',
      ],
    },
    {
      id: 'gold',
      name: 'GOLD',
      rate: '12%',
      color: '#ffd700',
      features: [
        'Alles von Silver',
        '24/7 Premium Support',
        'Marketing Support',
        'Priority Listing',
        'Dedicated Account Manager',
      ],
    },
  ];

  const handleSignAgreement = async () => {
    if (!termsAccepted) {
      setError('Bitte akzeptieren Sie die Nutzungsbedingungen');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('sign-charter-agreement', {
        body: {
          agreement_type: selectedTier,
          terms_accepted: true,
        },
      });

      if (error) throw error;
      if (!data.ok) throw new Error(data.error);

      console.log('✅ Vertrag unterzeichnet:', data);
      
      if (onSuccess) {
        onSuccess(data.agreement);
      }
    } catch (err) {
      console.error('❌ Agreement Error:', err);
      setError(err.message || 'Fehler beim Unterzeichnen des Vertrags');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="agreement-setup" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '12px' }}>
        📋 Provisionsvereinbarung
      </h2>
      <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '40px' }}>
        Wählen Sie ein Paket und schließen Sie Ihre Partnerschaft mit JetOpti ab
      </p>

      {/* TIER-KARTEN */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '24px',
        marginBottom: '40px'
      }}>
        {tiers.map(tier => (
          <div
            key={tier.id}
            onClick={() => setSelectedTier(tier.id)}
            style={{
              border: selectedTier === tier.id ? `3px solid ${tier.color}` : '2px solid #e5e7eb',
              borderRadius: '12px',
              padding: '24px',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s',
              background: selectedTier === tier.id ? '#f9fafb' : 'white',
            }}
          >
            {tier.recommended && (
              <div style={{
                position: 'absolute',
                top: '-12px',
                right: '12px',
                background: '#10b981',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
              }}>
                EMPFOHLEN
              </div>
            )}

            <h3 style={{ 
              color: tier.color, 
              fontSize: '24px', 
              fontWeight: 'bold',
              marginBottom: '8px'
            }}>
              {tier.name}
            </h3>
            
            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px' }}>
              {tier.rate}
            </div>

            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              Provision pro Buchung
            </div>

            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {tier.features.map((feature, idx) => (
                <li key={idx} style={{ 
                  marginBottom: '12px', 
                  paddingLeft: '24px',
                  position: 'relative'
                }}>
                  <span style={{ 
                    position: 'absolute', 
                    left: 0, 
                    color: tier.color 
                  }}>
                    ✓
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* TERMS & CONDITIONS */}
      <div style={{ 
        background: '#f9fafb', 
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h3 style={{ marginBottom: '16px' }}>Nutzungsbedingungen & Provisionsvereinbarung</h3>
        
        <div style={{ 
          maxHeight: '200px', 
          overflowY: 'auto',
          padding: '16px',
          background: 'white',
          borderRadius: '6px',
          fontSize: '14px',
          lineHeight: '1.6',
          marginBottom: '16px'
        }}>
          <h4>1. Vertragsgegenstand</h4>
          <p>
            Dieser Vertrag regelt die Zusammenarbeit zwischen JetOpti und dem Charterbetreiber 
            für die Vermittlung von privaten Jet-Charter-Flügen über die JetOpti-Plattform.
          </p>

          <h4>2. Provisionsvereinbarung</h4>
          <p>
            Der Charterbetreiber verpflichtet sich, JetOpti eine Provision in Höhe von {' '}
            <strong>{tiers.find(t => t.id === selectedTier)?.rate}</strong> auf jede über die 
            Plattform vermittelte Buchung zu zahlen.
          </p>

          <h4>3. Zahlungsbedingungen</h4>
          <p>
            Die Provision wird monatlich abgerechnet. Die Zahlung ist innerhalb von 30 Tagen 
            nach Rechnungsstellung fällig. JetOpti stellt am Monatsende eine detaillierte 
            Abrechnung zur Verfügung.
          </p>

          <h4>4. Buchungsabwicklung</h4>
          <p>
            Der Charterbetreiber ist verantwortlich für die Durchführung des Fluges gemäß 
            aller geltenden Luftfahrtvorschriften. JetOpti fungiert ausschließlich als 
            Vermittlungsplattform.
          </p>

          <h4>5. Datenschutz</h4>
          <p>
            Beide Parteien verpflichten sich zur Einhaltung der DSGVO und aller relevanten 
            Datenschutzbestimmungen.
          </p>

          <h4>6. Vertragslaufzeit</h4>
          <p>
            Der Vertrag wird auf unbestimmte Zeit geschlossen und kann von beiden Parteien 
            mit einer Frist von 30 Tagen gekündigt werden.
          </p>
        </div>

        <label style={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
          />
          <span>
            Ich akzeptiere die Nutzungsbedingungen und Provisionsvereinbarung
          </span>
        </label>
      </div>

      {/* ERROR */}
      {error && (
        <div style={{ 
          background: '#fee2e2', 
          border: '1px solid #ef4444',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '16px',
          color: '#991b1b'
        }}>
          {error}
        </div>
      )}

      {/* SUBMIT */}
      <button
        onClick={handleSignAgreement}
        disabled={!termsAccepted || loading}
        style={{
          width: '100%',
          padding: '16px',
          background: termsAccepted ? '#10b981' : '#d1d5db',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: termsAccepted ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s',
        }}
      >
        {loading ? '⏳ Wird unterzeichnet...' : '✍️ Vertrag digital unterschreiben'}
      </button>

      <p style={{ 
        textAlign: 'center', 
        fontSize: '14px', 
        color: '#6b7280',
        marginTop: '16px'
      }}>
        🔒 Ihre Daten werden sicher verschlüsselt übertragen
      </p>
    </div>
  );
}

// ============================================================================
// 2. COMMISSION TAB - Abrechnungsübersicht im Dashboard
// ============================================================================

export function CommissionTab() {
  const { formatPrice } = useCurrency();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCommissionData();
  }, []);

  const loadCommissionData = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('get-commission-data');
      
      if (error) throw error;
      if (!result.ok) throw new Error(result.error);

      console.log('✅ Commission Data:', result);
      setData(result);
    } catch (err) {
      console.error('❌ Load Commission Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div className="spinner"></div>
        <p>Lade Abrechnungsdaten...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        background: '#fee2e2', 
        border: '1px solid #ef4444',
        borderRadius: '8px',
        padding: '20px',
        margin: '20px'
      }}>
        <strong>Fehler:</strong> {error}
      </div>
    );
  }

  if (!data?.hasAgreement) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>📋 Kein aktiver Vertrag</h2>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>
          Sie haben noch keinen Provisionsvertrag mit JetOpti.
        </p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 24px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Vertrag abschließen
        </button>
      </div>
    );
  }

  const { agreement, currentMonth, pastStatements, yearStats } = data;

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>💰 Abrechnungen & Provisionen</h2>
        <div style={{ 
          background: '#f3f4f6', 
          padding: '8px 16px', 
          borderRadius: '6px',
          fontSize: '14px'
        }}>
          <strong>{agreement.type.toUpperCase()}</strong> • {agreement.commission_rate}% Provision
        </div>
      </div>

      {/* AKTUELLER MONAT */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '12px',
        padding: '32px',
        marginBottom: '32px'
      }}>
        <h3 style={{ marginBottom: '8px', opacity: 0.9 }}>
          Laufender Monat ({currentMonth.month})
        </h3>
        <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '24px' }}>
          Status: Offen • Endet in {30 - new Date().getDate()} Tagen
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '24px'
        }}>
          <div>
            <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '4px' }}>
              Buchungen
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
              {currentMonth.total_bookings}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '4px' }}>
              Umsatz
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
              {formatPrice(currentMonth.total_revenue)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '4px' }}>
              Provision ({agreement.commission_rate}%)
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
              {formatPrice(currentMonth.total_commission)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '4px' }}>
              Status
            </div>
            <div style={{ fontSize: '16px', marginTop: '8px' }}>
              ⏳ {currentMonth.pending_count} Pending<br />
              ✅ {currentMonth.paid_count} Bezahlt
            </div>
          </div>
        </div>
      </div>

      {/* JAHRES-STATISTIK */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ marginBottom: '16px' }}>📅 Jahr {yearStats.year}</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '16px'
        }}>
          <div style={{ 
            background: '#f3f4f6', 
            padding: '20px', 
            borderRadius: '8px'
          }}>
            <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>
              Gesamt-Buchungen
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
              {yearStats.total_bookings}
            </div>
          </div>

          <div style={{ 
            background: '#f3f4f6', 
            padding: '20px', 
            borderRadius: '8px'
          }}>
            <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>
              Gesamt-Umsatz
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
              {formatPrice(yearStats.total_revenue)}
            </div>
          </div>

          <div style={{ 
            background: '#dcfce7', 
            padding: '20px', 
            borderRadius: '8px'
          }}>
            <div style={{ color: '#166534', fontSize: '14px', marginBottom: '4px' }}>
              Gesamt-Provision
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#166534' }}>
              {formatPrice(yearStats.total_commission)}
            </div>
          </div>
        </div>
      </div>

      {/* VERGANGENE MONATE */}
      <div>
        <h3 style={{ marginBottom: '16px' }}>📋 Vergangene Abrechnungen</h3>
        
        {pastStatements.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            background: '#f9fafb',
            borderRadius: '8px',
            color: '#6b7280'
          }}>
            Noch keine abgeschlossenen Abrechnungen
          </div>
        ) : (
          <div style={{ 
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                    Monat
                  </th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                    Buchungen
                  </th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                    Umsatz
                  </th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                    Provision
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                    Status
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                    Rechnung
                  </th>
                </tr>
              </thead>
              <tbody>
                {pastStatements.map((statement, idx) => (
                  <tr key={statement.id} style={{ 
                    borderBottom: idx < pastStatements.length - 1 ? '1px solid #e5e7eb' : 'none'
                  }}>
                    <td style={{ padding: '12px' }}>
                      <strong>{new Date(statement.month).toLocaleDateString('de-DE', { 
                        year: 'numeric', 
                        month: 'long' 
                      })}</strong>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      {statement.total_bookings}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      {formatPrice(statement.total_revenue)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>
                      {formatPrice(statement.total_commission)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {statement.status === 'paid' && '✅ Bezahlt'}
                      {statement.status === 'sent' && '📧 Versendet'}
                      {statement.status === 'overdue' && '⚠️ Überfällig'}
                      {statement.status === 'draft' && '📝 Entwurf'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {statement.pdf_url ? (
                        <a 
                          href={statement.pdf_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: '#3b82f6', textDecoration: 'none' }}
                        >
                          📄 PDF
                        </a>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EINZELNE TRANSAKTIONEN (Laufender Monat) */}
      {currentMonth.transactions.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h3 style={{ marginBottom: '16px' }}>
            🧾 Einzelne Buchungen ({currentMonth.month})
          </h3>
          
          <div style={{ 
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                    Datum
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                    Route
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                    Kunde
                  </th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                    Preis
                  </th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                    Provision
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentMonth.transactions.map((tx, idx) => (
                  <tr key={tx.id} style={{ 
                    borderBottom: idx < currentMonth.transactions.length - 1 ? '1px solid #e5e7eb' : 'none'
                  }}>
                    <td style={{ padding: '12px' }}>
                      {new Date(tx.created_at).toLocaleDateString('de-DE')}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {tx.bookings?.from_iata} → {tx.bookings?.to_iata}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {tx.bookings?.customer_name || 'N/A'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      {formatPrice(tx.charter_price)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>
                      {formatPrice(tx.commission_amount)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {tx.status === 'pending' && '⏳'}
                      {tx.status === 'approved' && '✅'}
                      {tx.status === 'paid' && '💰'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS (für nächste Nachricht - zu groß!)
// ============================================================================
// src/components/CommissionComponents_Part2.jsx
// ✅ Part 2: Manuelle Hot Deals Components
// Komponenten: ManualHotDealModal, HotDealsTabExtended



// ============================================================================
// 3. MANUAL HOT DEAL MODAL - Manuellen Hot Deal erstellen
// ============================================================================

export function ManualHotDealModal({ jets, airports, onClose, onSuccess }) {
  const [form, setForm] = useState({
    jet_id: '',
    reason: 'repositioning',
    from_iata: '',
    to_iata: '',
    departure_date: '',
    discount: 50,
    available_until_hours: 72,
    notes: '',
    external_booking_reference: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filtered Jets (nur mit allow_empty_legs = true)
  const availableJets = jets.filter(j => j.allow_empty_legs);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validierung
    if (!form.jet_id) {
      setError('Bitte wählen Sie einen Jet aus');
      return;
    }
    if (!form.from_iata || !form.to_iata) {
      setError('Bitte geben Sie Start- und Zielflughafen an');
      return;
    }
    if (form.from_iata === form.to_iata) {
      setError('Start- und Zielflughafen müssen unterschiedlich sein');
      return;
    }
    if (!form.departure_date) {
      setError('Bitte wählen Sie ein Abflugdatum');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('create-manual-hot-deal', {
        body: {
          jet_id: form.jet_id,
          reason: form.reason,
          from_iata: form.from_iata,
          to_iata: form.to_iata,
          departure_date: form.departure_date,
          discount: parseFloat(form.discount),
          available_until_hours: parseInt(form.available_until_hours),
          notes: form.notes || null,
          external_booking_reference: form.external_booking_reference || null,
        },
      });

      if (error) throw error;
      if (!data.ok) throw new Error(data.error);

      console.log('✅ Hot Deal erstellt:', data);
      
      if (onSuccess) {
        onSuccess(data.hotDeal);
      }
      
      onClose();
    } catch (err) {
      console.error('❌ Create Hot Deal Error:', err);
      setError(err.message || 'Fehler beim Erstellen des Hot Deals');
    } finally {
      setLoading(false);
    }
  };

  const selectedJet = jets.find(j => j.id === form.jet_id);

  return (
    <div 
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div 
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '12px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ 
          padding: '24px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{ margin: 0 }}>✍️ Manuellen Hot Deal erstellen</h2>
          <p style={{ color: '#6b7280', marginTop: '8px', marginBottom: 0 }}>
            Erstellen Sie einen Leerflug-Angebot für Jets die über externe Kanäle gebucht wurden
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* JET AUSWAHL */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Jet *
            </label>
            <select
              name="jet_id"
              value={form.jet_id}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            >
              <option value="">Wählen Sie einen Jet...</option>
              {availableJets.length === 0 && (
                <option disabled>Keine Jets mit Hot Deals verfügbar</option>
              )}
              {availableJets.map(jet => (
                <option key={jet.id} value={jet.id}>
                  {jet.name} ({jet.type}) • {jet.current_iata || 'Position unbekannt'}
                </option>
              ))}
            </select>
            {availableJets.length === 0 && (
              <small style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                Bitte aktivieren Sie "Hot Deals" in den Jet-Einstellungen
              </small>
            )}
            {selectedJet && (
              <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                Aktuelle Position: {selectedJet.current_iata || 'Unbekannt'} • 
                Reichweite: {selectedJet.range} km
              </small>
            )}
          </div>

          {/* GRUND */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Grund für Leerflug *
            </label>
            <select
              name="reason"
              value={form.reason}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            >
              <option value="repositioning">🏠 Repositionierung (Jet zurück zur Home Base)</option>
              <option value="maintenance">🔧 Wartungsflug (Service-Center)</option>
              <option value="external_booking">📞 Externe Buchung (über anderen Broker)</option>
              <option value="seasonal">🌍 Saisonale Verlagerung</option>
              <option value="other">➕ Anderer Grund</option>
            </select>
          </div>

          {/* EXTERNE BUCHUNGSREFERENZ */}
          {form.reason === 'external_booking' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Externe Buchungsreferenz (optional)
              </label>
              <input
                type="text"
                name="external_booking_reference"
                value={form.external_booking_reference}
                onChange={handleChange}
                placeholder="z.B. PrivateFly #12345"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
            </div>
          )}

          {/* ROUTE */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div>
              <AirportSearchInput
                label="Von (Leerflug-Start) *"
                value={form.from_iata}
                onChange={(iata) => setForm(prev => ({ ...prev, from_iata: iata }))}
                onSelect={(airport) => setForm(prev => ({ ...prev, from_iata: airport.iata }))}
                airports={airports}
                placeholder="z.B. FRA oder PRG"
                required
              />
            </div>
            <div>
              <AirportSearchInput
                label="Nach (Leerflug-Ziel) *"
                value={form.to_iata}
                onChange={(iata) => setForm(prev => ({ ...prev, to_iata: iata }))}
                onSelect={(airport) => setForm(prev => ({ ...prev, to_iata: airport.iata }))}
                airports={airports}
                placeholder="z.B. LHR oder MUC"
                required
              />
            </div>
          </div>

          {/* ABFLUGDATUM */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Abflugdatum & Uhrzeit *
            </label>
            <input
              type="datetime-local"
              name="departure_date"
              value={form.departure_date}
              onChange={handleChange}
              min={new Date().toISOString().slice(0, 16)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>

          {/* RABATT */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Rabatt (%) *
            </label>
            <input
              type="number"
              name="discount"
              value={form.discount}
              onChange={handleChange}
              min="0"
              max="100"
              step="5"
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
            <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              Der Normalpreis wird automatisch um {form.discount}% reduziert
            </small>
          </div>

          {/* VERFÜGBARKEIT */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Verfügbar bis *
            </label>
            <select
              name="available_until_hours"
              value={form.available_until_hours}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            >
              <option value="24">24 Stunden vor Abflug</option>
              <option value="48">48 Stunden vor Abflug</option>
              <option value="72">72 Stunden vor Abflug (empfohlen)</option>
              <option value="120">5 Tage vor Abflug</option>
              <option value="168">7 Tage vor Abflug</option>
            </select>
          </div>

          {/* NOTIZEN */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Interne Notizen (optional)
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="z.B. 'Jet kommt von Buchung über PrivateFly, Kunde fliegt weiter nach Dubai'"
              rows="3"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                resize: 'vertical',
              }}
            />
          </div>

          {/* ERROR */}
          {error && (
            <div style={{ 
              background: '#fee2e2', 
              border: '1px solid #ef4444',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '16px',
              color: '#991b1b',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* BUTTONS */}
          <div style={{ 
            display: 'flex', 
            gap: '12px',
            paddingTop: '16px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading || availableJets.length === 0}
              style={{
                flex: 1,
                padding: '12px',
                background: loading ? '#d1d5db' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              {loading ? '⏳ Wird erstellt...' : '✅ Hot Deal erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// 4. HOT DEALS TAB EXTENDED - Erweiterte Hot Deals Liste mit Manual Support
// ============================================================================

export function HotDealsTabExtended({ jets, airports }) {
  const { formatPrice } = useCurrency();
  const [hotDeals, setHotDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showManualModal, setShowManualModal] = useState(false);
  const [filterSource, setFilterSource] = useState('all'); // 'all', 'auto', 'manual'

  useEffect(() => {
    loadHotDeals();
  }, []);

  const loadHotDeals = async () => {
    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('empty_legs')
        .select(`
          *,
          jets (
            id,
            name,
            type,
            seats
          )
        `)
        .eq('jets.company_id', user.data.user.id)
        .gte('available_until', new Date().toISOString())
        .order('departure_date', { ascending: true });

      if (error) throw error;

      console.log('✅ Hot Deals geladen:', data?.length);
      setHotDeals(data || []);
    } catch (err) {
      console.error('❌ Load Hot Deals Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSuccess = (newHotDeal) => {
    console.log('✅ Neuer Hot Deal:', newHotDeal);
    loadHotDeals(); // Reload
  };

  const handleDelete = async (hotDealId, source) => {
    if (source === 'auto') {
      alert('Automatische Hot Deals können nicht gelöscht werden. Sie werden nach Ablauf automatisch entfernt.');
      return;
    }

    if (!confirm('Möchten Sie diesen Hot Deal wirklich löschen?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('empty_legs')
        .delete()
        .eq('id', hotDealId);

      if (error) throw error;

      console.log('✅ Hot Deal gelöscht');
      loadHotDeals(); // Reload
    } catch (err) {
      console.error('❌ Delete Error:', err);
      alert('Fehler beim Löschen: ' + err.message);
    }
  };

  const filteredDeals = hotDeals.filter(deal => {
    if (filterSource === 'all') return true;
    return deal.source === filterSource;
  });

  const autoCount = hotDeals.filter(d => d.source === 'auto').length;
  const manualCount = hotDeals.filter(d => d.source === 'manual').length;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div className="spinner"></div>
        <p>Lade Hot Deals...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* HEADER */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h2 style={{ margin: 0, marginBottom: '8px' }}>🔥 Hot Deals</h2>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            {autoCount} Automatisch • {manualCount} Manuell erstellt
          </div>
        </div>
        <button
          onClick={() => setShowManualModal(true)}
          style={{
            padding: '12px 24px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '18px' }}>+</span>
          Manuellen Hot Deal erstellen
        </button>
      </div>

      {/* FILTER */}
      <div style={{ 
        display: 'flex', 
        gap: '8px',
        marginBottom: '24px',
        padding: '4px',
        background: '#f3f4f6',
        borderRadius: '8px',
        width: 'fit-content'
      }}>
        <button
          onClick={() => setFilterSource('all')}
          style={{
            padding: '8px 16px',
            background: filterSource === 'all' ? 'white' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: filterSource === 'all' ? '600' : '400',
          }}
        >
          Alle ({hotDeals.length})
        </button>
        <button
          onClick={() => setFilterSource('auto')}
          style={{
            padding: '8px 16px',
            background: filterSource === 'auto' ? 'white' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: filterSource === 'auto' ? '600' : '400',
          }}
        >
          🤖 Automatisch ({autoCount})
        </button>
        <button
          onClick={() => setFilterSource('manual')}
          style={{
            padding: '8px 16px',
            background: filterSource === 'manual' ? 'white' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: filterSource === 'manual' ? '600' : '400',
          }}
        >
          ✍️ Manuell ({manualCount})
        </button>
      </div>

      {/* LISTE */}
      {filteredDeals.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          background: '#f9fafb',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <h3 style={{ marginBottom: '8px' }}>Keine Hot Deals gefunden</h3>
          <p style={{ color: '#6b7280' }}>
            {filterSource === 'manual' 
              ? 'Erstellen Sie Ihren ersten manuellen Hot Deal!'
              : 'Sobald Jets gebucht werden, erscheinen hier automatisch Hot Deals.'}
          </p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '20px'
        }}>
          {filteredDeals.map(deal => (
            <div
              key={deal.id}
              style={{
                background: 'white',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                padding: '20px',
                position: 'relative',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
            >
              {/* BADGE */}
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: deal.source === 'manual' ? '#fef3c7' : '#dbeafe',
                color: deal.source === 'manual' ? '#92400e' : '#1e40af',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600',
              }}>
                {deal.source === 'manual' ? '✍️ Manuell' : '🤖 Auto'}
              </div>

              {/* JET */}
              <div style={{ marginBottom: '12px', marginTop: '8px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '18px' }}>
                  {deal.jets?.name}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  {deal.jets?.type} • {deal.jets?.seats} Sitze
                </div>
              </div>

              {/* ROUTE */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontSize: '16px',
                  fontWeight: '500'
                }}>
                  <span>{deal.from_city || deal.from_iata}</span>
                  <span style={{ color: '#ef4444' }}>→</span>
                  <span>{deal.to_city || deal.to_iata}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  {deal.distance_km} km • {deal.from_iata} → {deal.to_iata}
                </div>
              </div>

              {/* DATUM */}
              <div style={{ marginBottom: '16px', fontSize: '14px' }}>
                <div>
                  🗓️ <strong>Abflug:</strong>{' '}
                  {new Date(deal.departure_date).toLocaleString('de-DE', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div style={{ color: '#6b7280', marginTop: '4px' }}>
                  ⏰ <strong>Buchbar bis:</strong>{' '}
                  {new Date(deal.available_until).toLocaleString('de-DE', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              {/* PREIS */}
              <div style={{ 
                marginBottom: '16px',
                padding: '12px',
                background: '#f0fdf4',
                borderRadius: '8px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', textDecoration: 'line-through' }}>
                      {formatPrice(deal.normal_price)}
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#166534' }}>
                      {formatPrice(deal.discounted_price)}
                    </div>
                  </div>
                  <div style={{
                    background: '#ef4444',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                  }}>
                    -{deal.discount}%
                  </div>
                </div>
              </div>

              {/* GRUND (nur bei manuell) */}
              {deal.source === 'manual' && deal.reason && (
                <div style={{ 
                  fontSize: '13px', 
                  color: '#6b7280',
                  marginBottom: '12px',
                  padding: '8px',
                  background: '#f9fafb',
                  borderRadius: '6px'
                }}>
                  <strong>Grund:</strong>{' '}
                  {deal.reason === 'repositioning' && '🏠 Repositionierung'}
                  {deal.reason === 'maintenance' && '🔧 Wartung'}
                  {deal.reason === 'external_booking' && '📞 Externe Buchung'}
                  {deal.reason === 'seasonal' && '🌍 Saisonal'}
                  {deal.reason === 'other' && '➕ Sonstiges'}
                  
                  {deal.external_booking_reference && (
                    <div style={{ marginTop: '4px', fontSize: '12px' }}>
                      Ref: {deal.external_booking_reference}
                    </div>
                  )}
                </div>
              )}

              {/* NOTIZEN (nur bei manuell) */}
              {deal.source === 'manual' && deal.notes && (
                <div style={{ 
                  fontSize: '12px', 
                  color: '#6b7280',
                  marginBottom: '12px',
                  fontStyle: 'italic'
                }}>
                  💬 {deal.notes}
                </div>
              )}

              {/* ACTIONS */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {deal.source === 'manual' && (
                  <button
                    onClick={() => handleDelete(deal.id, deal.source)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: '#fee2e2',
                      color: '#991b1b',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                    }}
                  >
                    🗑️ Löschen
                  </button>
                )}
                <button
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                  }}
                >
                  📊 Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {showManualModal && (
        <ManualHotDealModal
          jets={jets}
          airports={airports}
          onClose={() => setShowManualModal(false)}
          onSuccess={handleManualSuccess}
        />
      )}
    </div>
  );
}

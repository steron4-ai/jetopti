// src/components/CommissionTab.jsx
// ✅ Robuste Version - funktioniert auch ohne Edge Function

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useCurrency } from '../lib/CurrencyContext';

export default function CommissionTab() {
  const { formatPrice } = useCurrency();
  const [agreement, setAgreement] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCommissionData();
  }, []);

  const loadCommissionData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 1. Hole User
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        throw new Error('Nicht eingeloggt');
      }

      // 2. Hole Agreement DIREKT (ohne Edge Function)
      const { data: agreementData, error: agreementError } = await supabase
        .from('charter_agreements')
        .select('*')
        .eq('company_id', userData.user.id)
        .eq('status', 'active')
        .maybeSingle(); // maybeSingle statt single - kein Error wenn leer

      console.log('✅ Agreement geladen:', agreementData);
      setAgreement(agreementData);

      // 3. Wenn Agreement existiert, lade Transaktionen
      if (agreementData) {
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const { data: transactionsData, error: txError } = await supabase
          .from('commission_transactions')
          .select(`
            *,
            bookings (
              id,
              from_iata,
              to_iata,
              departure_date
            )
          `)
          .eq('company_id', userData.user.id)
          .gte('created_at', currentMonthStart)
          .order('created_at', { ascending: false });

        if (txError) {
          console.warn('Transactions Error:', txError);
        } else {
          console.log('✅ Transactions geladen:', transactionsData?.length || 0);
          setTransactions(transactionsData || []);
        }
      }
    } catch (err) {
      console.error('❌ Load Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div className="spinner" style={{
          border: '4px solid #f3f4f6',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }}></div>
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
        <br /><br />
        <button 
          onClick={loadCommissionData}
          style={{
            padding: '8px 16px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  // KEIN AGREEMENT
  if (!agreement) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '60px 20px',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
        <h2 style={{ marginBottom: '12px' }}>Kein aktiver Vertrag</h2>
        <p style={{ color: '#6b7280', marginBottom: '24px', lineHeight: '1.6' }}>
          Sie haben noch keinen Provisionsvertrag mit JetOpti unterzeichnet.
          <br />
          Bitte kontaktieren Sie uns, um einen Vertrag abzuschließen.
        </p>
        <div style={{
          background: '#f3f4f6',
          padding: '20px',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#4b5563'
        }}>
          <strong>💡 Tipp:</strong> Mit einem aktiven Vertrag sehen Sie hier:
          <ul style={{ textAlign: 'left', marginTop: '12px', paddingLeft: '20px' }}>
            <li>Monatliche Abrechnungen</li>
            <li>Provisions-Übersicht</li>
            <li>Einzelne Transaktionen</li>
            <li>Jahresstatistiken</li>
          </ul>
        </div>
      </div>
    );
  }

  // AGREEMENT EXISTIERT
  const currentMonth = new Date().toLocaleDateString('de-DE', { 
    year: 'numeric', 
    month: 'long' 
  });

  const totalRevenue = transactions.reduce((sum, tx) => sum + Number(tx.charter_price || 0), 0);
  const totalCommission = transactions.reduce((sum, tx) => sum + Number(tx.commission_amount || 0), 0);

  const tierNames = {
    bronze: 'BRONZE',
    silver: 'SILVER',
    gold: 'GOLD'
  };

  const tierColors = {
    bronze: '#cd7f32',
    silver: '#c0c0c0',
    gold: '#ffd700'
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* HEADER */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <h2 style={{ margin: 0 }}>💰 Abrechnungen & Provisionen</h2>
        <div style={{ 
          background: '#f3f4f6', 
          padding: '8px 16px', 
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          color: tierColors[agreement.agreement_type] || '#4b5563'
        }}>
          {tierNames[agreement.agreement_type] || agreement.agreement_type.toUpperCase()} • {agreement.commission_rate}% Provision
        </div>
      </div>

      {/* VERTRAGSINFORMATIONEN */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h3 style={{ margin: '0 0 16px 0', opacity: 0.9 }}>Vertragsinformationen</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px'
        }}>
          <div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>Vertragstyp</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px' }}>
              {tierNames[agreement.agreement_type]}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>Provision</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px' }}>
              {agreement.commission_rate}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>Unterzeichnet am</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px' }}>
              {new Date(agreement.signed_at).toLocaleDateString('de-DE')}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>Status</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px' }}>
              ✅ Aktiv
            </div>
          </div>
        </div>
      </div>

      {/* AKTUELLER MONAT */}
      <div style={{
        background: '#f9fafb',
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h3 style={{ margin: '0 0 16px 0' }}>
          Laufender Monat ({currentMonth})
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px'
        }}>
          <div style={{ 
            background: 'white',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>
              Buchungen
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
              {transactions.length}
            </div>
          </div>

          <div style={{ 
            background: 'white',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>
              Umsatz
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
              {formatPrice(totalRevenue)}
            </div>
          </div>

          <div style={{ 
            background: '#dcfce7',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #86efac'
          }}>
            <div style={{ color: '#166534', fontSize: '14px', marginBottom: '4px' }}>
              Provision ({agreement.commission_rate}%)
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#166534' }}>
              {formatPrice(totalCommission)}
            </div>
          </div>

          <div style={{ 
            background: 'white',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>
              Status
            </div>
            <div style={{ fontSize: '14px', marginTop: '8px' }}>
              ⏳ {transactions.filter(t => t.status === 'pending').length} Ausstehend<br />
              ✅ {transactions.filter(t => t.status === 'paid').length} Bezahlt
            </div>
          </div>
        </div>
      </div>

      {/* TRANSAKTIONEN */}
      {transactions.length > 0 ? (
        <div>
          <h3 style={{ marginBottom: '16px' }}>
            🧾 Einzelne Transaktionen ({currentMonth})
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
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                    Flugpreis
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
                {transactions.map((tx, idx) => (
                  <tr key={tx.id} style={{ 
                    borderBottom: idx < transactions.length - 1 ? '1px solid #e5e7eb' : 'none'
                  }}>
                    <td style={{ padding: '12px' }}>
                      {new Date(tx.created_at).toLocaleDateString('de-DE')}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {tx.bookings?.from_iata || 'N/A'} → {tx.bookings?.to_iata || 'N/A'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      {formatPrice(tx.charter_price)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>
                      {formatPrice(tx.commission_amount)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {tx.status === 'pending' && '⏳ Ausstehend'}
                      {tx.status === 'approved' && '✅ Bestätigt'}
                      {tx.status === 'paid' && '💰 Bezahlt'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          background: '#f9fafb',
          borderRadius: '8px',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <h3 style={{ marginBottom: '8px' }}>Noch keine Transaktionen</h3>
          <p style={{ margin: 0 }}>
            Sobald Buchungen über JetOpti abgeschlossen werden, erscheinen diese hier.
          </p>
        </div>
      )}

      {/* INFO BOX */}
      <div style={{
        background: '#eff6ff',
        border: '1px solid #3b82f6',
        borderRadius: '8px',
        padding: '16px',
        marginTop: '24px',
        fontSize: '14px',
        color: '#1e40af'
      }}>
        <strong>💡 Information:</strong> Provisionen werden automatisch berechnet, sobald eine Buchung den Status "Confirmed" erhält. 
        Am Monatsende erhalten Sie eine detaillierte Abrechnung per E-Mail.
      </div>
    </div>
  );
}

// src/pages/MyBookings.jsx
// ✅ KORRIGIERT: Real-Time Subscription + korrekter Code

import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import './MyBookings.css';

// Hilfsfunktion, um das Datum zu formatieren
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function MyBookings() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Funktion zum Laden der Buchungen
  const loadBookings = async () => {
    if (!profile?.email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('customer_email', profile.email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error("Fehler beim Abrufen der Buchungen:", err);
      setError("Ihre Buchungen konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    loadBookings();
  }, [profile]);

  // ✨ Real-Time Subscription
  useEffect(() => {
    if (!profile?.email) return;

    console.log('🔔 Setting up real-time subscription');

    const subscription = supabase
      .channel('bookings_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `customer_email=eq.${profile.email}`
        },
        (payload) => {
          console.log('✨ Booking Status geändert!', payload);
          
          // Zeige Toast wenn Status sich ändert
          if (payload.new.status === 'accepted') {
            alert('🎉 Ihre Buchung wurde bestätigt!');
          } else if (payload.new.status === 'rejected') {
            alert('❌ Ihre Buchung wurde leider abgelehnt.');
          }
          
          // Reload bookings
          loadBookings();
        }
      )
      .subscribe();

    return () => {
      console.log('🔕 Unsubscribing from bookings');
      subscription.unsubscribe();
    };
  }, [profile]);

  // Render-Logik
  const renderContent = () => {
    if (loading) {
      return <div className="my-bookings-loading">Lade Buchungen...</div>;
    }

    if (error) {
      return <div className="my-bookings-error">Fehler: {error}</div>;
    }

    if (bookings.length === 0) {
      return <div className="my-bookings-empty">Sie haben noch keine Buchungen.</div>;
    }

    return (
      <table className="bookings-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Jet</th>
            <th>Von</th>
            <th>Nach</th>
            <th>Abflug</th>
            <th>Passagiere</th>
            <th>Preis</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id} className={`booking-status-${booking.status}`}>
              <td>
                <span className={`status-badge status-${String(booking.status).toLowerCase()}`}>
                  {booking.status === 'pending' && '⏳ Ausstehend'}
                  {booking.status === 'accepted' && '✅ Bestätigt'}
                  {booking.status === 'rejected' && '❌ Abgelehnt'}
                  {booking.status === 'completed' && '✨ Abgeschlossen'}
                </span>
              </td>
              <td>{booking.jet_name || 'N/A'} ({booking.jet_type || 'N/A'})</td>
              <td>{booking.from_location || booking.from_iata || 'N/A'}</td>
              <td>{booking.to_location || booking.to_iata || 'N/A'}</td>
              <td>{formatDate(booking.departure_date)}</td>
              <td>{booking.passengers}</td>
              <td>€{booking.total_price?.toLocaleString() || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="my-bookings-page">
      <div className="my-bookings-container">
        <a href="/" className="back-to-map-link">
          &larr; Zurück zur Karte
        </a>
        <h1>Meine Buchungen</h1>
        <p>Hier sehen Sie eine Übersicht aller Ihrer vergangenen und aktuellen Fluganfragen.</p>
        
        <div className="my-bookings-list">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
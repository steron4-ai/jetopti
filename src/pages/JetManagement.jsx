// src/pages/JetManagement.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
// Wir importieren deine Dashboard-Styles, damit alles gleich aussieht
import './Dashboard.css'; 

// Wir importieren die JetCard, die wir später erstellen
// import JetCard from '../components/JetCard'; 
// Wir importieren das Formular, das wir später erstellen
// import JetForm from '../components/JetForm';

const JetManagement = ({ user }) => {
  const [jets, setJets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingJet, setEditingJet] = useState(null);

  useEffect(() => {
    fetchJets();
  }, []);

  // 1. Funktion: Jets vom Server laden
  const fetchJets = async () => {
    setLoading(true);
    try {
      // Nutzt die company_jets Tabelle, um nur die Jets dieser Company zu holen
      // (gemäß deinem Schema-Plan)
      const { data, error } = await supabase
        .from('company_jets')
        .select(`
          jets (
            id,
            type,
            seats,
            price_per_hour,
            is_available
          )
        `)
        .eq('company_id', user.id);

      if (error) throw error;
      
      // Die Daten kommen verschachtelt an, wir entpacken sie
      const companyJets = data.map(item => item.jets);
      setJets(companyJets);
      
    } catch (error) {
      console.error('Error fetching jets:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Funktion: Jet Hinzufügen (Platzhalter)
  const handleAddJet = async (jetData) => {
    console.log("Neuer Jet wird hinzugefügt:", jetData);
    // Hier kommt die Supabase 'addJet' Logik rein
    // ...
    // fetchJets(); // Neu laden
    // setShowAddModal(false);
  };

  // 3. Funktion: Jet Löschen (Platzhalter)
  const handleDeleteJet = async (jetId) => {
    console.log("Lösche Jet:", jetId);
    // Hier kommt die Supabase 'deleteJet' Logik rein
    // ...
    // fetchJets(); // Neu laden
  };
  
  // 4. Funktion: Jet Bearbeiten (Platzhalter)
  const handleUpdateJet = async (jetData) => {
    console.log("Update Jet:", jetData);
    // Hier kommt die Supabase 'updateJet' Logik rein
    // ...
    // fetchJets(); // Neu laden
    // setEditingJet(null);
  };

  if (loading) {
    return <div>Loading your jets...</div>;
  }

  return (
    <div className="jet-management-container">
      <div className="jet-management-header">
        <h3>Your Fleet</h3>
        <button 
          className="btn-primary" // Style aus CODE_SNIPPETS.md
          onClick={() => setShowAddModal(true)}
        >
          + Add New Jet
        </button>
      </div>

      {/* --- MODAL FÜR NEUEN JET (Platzhalter) --- */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h2>Add New Jet</h2>
            {/* <JetForm onSubmit={handleAddJet} onCancel={() => setShowAddModal(false)} /> */}
            <p>Hier kommt das JetForm hin.</p>
            <button onClick={() => setShowAddModal(false)}>Close</button>
          </div>
        </div>
      )}
      
      {/* --- MODAL FÜR EDIT (Platzhalter) --- */}
      {editingJet && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h2>Edit Jet</h2>
            {/* <JetForm initialData={editingJet} onSubmit={handleUpdateJet} onCancel={() => setEditingJet(null)} /> */}
            <p>Hier kommt das JetForm (pre-filled) hin.</p>
            <button onClick={() => setEditingJet(null)}>Close</button>
          </div>
        </div>
      )}

      {/* --- JET LISTE --- */}
      <div className="jets-grid-list">
        {jets.length === 0 ? (
          <p>You haven't added any jets yet.</p>
        ) : (
          jets.map((jet) => (
            <div key={jet.id} className="jet-card-placeholder">
              <h4>{jet.type}</h4>
              <p>Seats: {jet.seats}</p>
              <p>€{jet.price_per_hour}/h</p>
              <p>{jet.is_available ? '✅ Available' : '❌ Unavailable'}</p>
              <button onClick={() => setEditingJet(jet)}>Edit</button>
              <button onClick={() => handleDeleteJet(jet.id)}>Delete</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default JetManagement;
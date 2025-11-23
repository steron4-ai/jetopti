// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// Konfiguration (wie in DATABASE_REFERENCE.md)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- ANGEPASSTE FUNKTION ---
// Holt jetzt auch die company_id für jede Buchung
export const getAvailableJets = async () => {
  console.log("getAvailableJets: Fetching jets...");
  
  const { data, error } = await supabase
    .from('jets')
    .select(`
      *,
      company_jets (
        company_id
      )
    `)
    // 🔥 WICHTIG: sowohl "verfügbar" als auch "in_flight" holen
    .in('status', ['verfügbar', 'in_flight']);

  if (error) {
    console.error("Error fetching jets with company_id:", error);
    return { data: null, error };
  }

  const formattedData = (data || [])
    .map((jet) => {
      const companyLink =
        Array.isArray(jet.company_jets) && jet.company_jets.length > 0
          ? jet.company_jets[0]
          : null;

      return {
        ...jet,
        company_id: companyLink ? companyLink.company_id : null,
        company_jets: undefined, // verschachteltes Array entfernen
        // optional: Koordinaten sicher als Zahl
        current_lat:
          jet.current_lat !== null && jet.current_lat !== undefined
            ? Number(jet.current_lat)
            : null,
        current_lng:
          jet.current_lng !== null && jet.current_lng !== undefined
            ? Number(jet.current_lng)
            : null,
      };
    })
    // Nur Jets mit Firma anzeigen
    .filter((jet) => jet.company_id !== null);

  console.log(`getAvailableJets: Returning ${formattedData.length} formatted jets.`);
  return { data: formattedData, error: null };
};

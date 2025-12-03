// AirportSearchInput.jsx
// ✅ Saubere Airport-Suche ohne Chaos - funktioniert wie Expedia/Booking.com

import { useState, useEffect, useRef } from 'react';

/**
 * Normalisiere String für bessere Suche (Umlaute etc.)
 */
function normalizeString(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Entferne Akzente
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss');
}

/**
 * Beliebte Flughäfen (höhere Priorität in Suchergebnissen)
 */
const POPULAR_AIRPORTS = new Set([
  'LHR', 'LGW', 'LCY', // London
  'CDG', 'ORY', 'NCE', // Paris, Nizza
  'FRA', 'MUC', 'TXL', 'BER', // Deutschland
  'ZRH', 'GVA', // Schweiz
  'VIE', // Wien
  'AMS', // Amsterdam
  'BCN', 'MAD', 'PMI', 'IBZ', // Spanien
  'FCO', 'MXP', 'VCE', // Italien
  'JFK', 'LAX', 'MIA', 'SFO', // USA
  'DXB', 'DOH', 'AUH', // Mittlerer Osten
  'SIN', 'HKG', 'NRT', // Asien
]);

/**
 * Airport Aliases - bekannte Suchbegriffe für Flughäfen
 * Format: Suchbegriff → [IATA-Codes]
 */
const AIRPORT_ALIASES = {
  // Deutschland
  'berlin': ['BER', 'TXL', 'SXF'],
  'munchen': ['MUC'],
  'muenchen': ['MUC'],
  'munich': ['MUC'],
  'frankfurt': ['FRA', 'HHN'],
  'hamburg': ['HAM'],
  'dusseldorf': ['DUS'],
  'duesseldorf': ['DUS'],
  'koln': ['CGN'],
  'cologne': ['CGN'],
  'stuttgart': ['STR'],
  'leipzig': ['LEJ'],
  'hannover': ['HAJ'],
  'nurnberg': ['NUE'],
  'nuremberg': ['NUE'],
  'bremen': ['BRE'],
  'dresden': ['DRS'],
  
  // UK
  'london': ['LHR', 'LGW', 'LCY', 'STN', 'LTN'],
  'manchester': ['MAN'],
  'birmingham': ['BHX'],
  'edinburgh': ['EDI'],
  'glasgow': ['GLA'],
  
  // USA
  'new york': ['JFK', 'EWR', 'LGA'],
  'newyork': ['JFK', 'EWR', 'LGA'],
  'los angeles': ['LAX', 'BUR', 'ONT', 'SNA'],
  'losangeles': ['LAX', 'BUR', 'ONT', 'SNA'],
  'chicago': ['ORD', 'MDW'],
  'washington': ['IAD', 'DCA', 'BWI'],
  'san francisco': ['SFO', 'OAK', 'SJC'],
  'sanfrancisco': ['SFO', 'OAK', 'SJC'],
  'miami': ['MIA', 'FLL'],
  'houston': ['IAH', 'HOU'],
  'dallas': ['DFW', 'DAL'],
  
  // Frankreich
  'paris': ['CDG', 'ORY', 'LBG'],
  'nice': ['NCE'],
  'nizza': ['NCE'],
  'lyon': ['LYS'],
  'marseille': ['MRS'],
  
  // Italien
  'rome': ['FCO', 'CIA'],
  'rom': ['FCO', 'CIA'],
  'milan': ['MXP', 'LIN', 'BGY'],
  'mailand': ['MXP', 'LIN', 'BGY'],
  'venice': ['VCE'],
  'venedig': ['VCE'],
  
  // Spanien
  'barcelona': ['BCN'],
  'madrid': ['MAD'],
  'mallorca': ['PMI'],
  'palma': ['PMI'],
  'ibiza': ['IBZ'],
  
  // Schweiz
  'zurich': ['ZRH'],
  'zuerich': ['ZRH'],
  'geneva': ['GVA'],
  'genf': ['GVA'],
  'geneve': ['GVA'],
  'basel': ['BSL', 'MLH', 'EAP'],
  
  // Österreich
  'vienna': ['VIE'],
  'wien': ['VIE'],
  
  // Mittlerer Osten
  'dubai': ['DXB', 'DWC'],
  'abu dhabi': ['AUH'],
  'abudhabi': ['AUH'],
  'doha': ['DOH'],
  
  // Asien
  'tokyo': ['NRT', 'HND'],
  'singapore': ['SIN'],
  'singapur': ['SIN'],
  'hong kong': ['HKG'],
  'hongkong': ['HKG'],
  'beijing': ['PEK', 'PKX'],
  'peking': ['PEK', 'PKX'],
  'shanghai': ['PVG', 'SHA'],
};

export default function AirportSearchInput({
  label = 'Flughafen',
  placeholder = 'Stadt oder IATA-Code',
  value = '',
  onChange,
  airports = [],
  required = false,
}) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Wenn value von außen gesetzt wird, zeige den passenden Flughafen-Namen
  useEffect(() => {
    if (value && airports.length > 0) {
      const airport = airports.find((a) => a.iata === value);
      if (airport) {
        const displayName = airport.name || airport.city;
        setQuery(`${displayName} (${airport.iata})`);
      }
    }
  }, [value, airports]);

  // Suche Flughäfen basierend auf Eingabe
  useEffect(() => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    const normalizedQuery = normalizeString(query);
    
    // 1. Finde passende Aliases (auch Partial Matches!)
    // "leip" sollte "leipzig" Alias finden
    let aliasIatas = [];
    
    // Exakter Match zuerst
    if (AIRPORT_ALIASES[normalizedQuery]) {
      aliasIatas = AIRPORT_ALIASES[normalizedQuery];
    } else {
      // Partial Match: Suche Alias-Keys die mit der Query beginnen
      for (const [aliasKey, iatas] of Object.entries(AIRPORT_ALIASES)) {
        if (aliasKey.startsWith(normalizedQuery)) {
          aliasIatas.push(...iatas);
        }
      }
    }
    
    // Duplikate entfernen
    aliasIatas = [...new Set(aliasIatas)];
    
    // 2. Finde passende Flughäfen
    let matches = airports.filter((airport) => {
      const normalizedCity = normalizeString(airport.city || '');
      const normalizedName = normalizeString(airport.name || '');
      const normalizedIata = normalizeString(airport.iata || '');
      const normalizedCountry = normalizeString(airport.country || '');

      // Prüfe ob IATA in Alias-Liste ist
      const isAliasMatch = aliasIatas.includes(airport.iata);

      return (
        isAliasMatch ||
        normalizedIata.includes(normalizedQuery) ||
        normalizedCity.includes(normalizedQuery) ||
        normalizedName.includes(normalizedQuery) ||
        normalizedCountry.includes(normalizedQuery)
      );
    });

    // 3. Sortiere mit intelligentem Ranking
    matches.sort((a, b) => {
      // Score-System für besseres Ranking
      const getScore = (airport) => {
        let score = 0;
        const normalizedCity = normalizeString(airport.city || '');
        const normalizedName = normalizeString(airport.name || '');
        const normalizedIata = normalizeString(airport.iata || '');
        
        // Prüfe Alias-Match Qualität
        let isExactAliasMatch = false;
        let isPartialAliasMatch = false;
        
        if (AIRPORT_ALIASES[normalizedQuery]?.includes(airport.iata)) {
          isExactAliasMatch = true;
        } else if (aliasIatas.includes(airport.iata)) {
          isPartialAliasMatch = true;
        }
        
        // Höchste Priorität: Exakter Alias-Match (z.B. "leipzig" → LEJ)
        if (isExactAliasMatch) score += 1000;
        
        // Sehr hohe Priorität: Partial Alias-Match (z.B. "leip" → LEJ)
        if (isPartialAliasMatch) score += 900;
        
        // Sehr hohe Priorität: Beliebte Flughäfen
        if (POPULAR_AIRPORTS.has(airport.iata)) score += 500;
        
        // Hohe Priorität: Exakter IATA-Match
        if (normalizedIata === normalizedQuery) score += 400;
        if (normalizedIata.startsWith(normalizedQuery)) score += 300;
        
        // Mittlere Priorität: Stadt-Match
        if (normalizedCity === normalizedQuery) score += 200;
        if (normalizedCity.startsWith(normalizedQuery)) score += 150;
        
        // Niedrige Priorität: Name-Match
        if (normalizedName.startsWith(normalizedQuery)) score += 100;
        if (normalizedName.includes(normalizedQuery)) score += 50;
        
        return score;
      };

      const scoreA = getScore(a);
      const scoreB = getScore(b);
      
      if (scoreA !== scoreB) return scoreB - scoreA;
      
      // Bei gleichem Score: alphabetisch nach Stadt
      return (a.city || '').localeCompare(b.city || '');
    });

    // Begrenze auf 12 Ergebnisse
    setSuggestions(matches.slice(0, 12));
    setSelectedIndex(-1);
  }, [query, airports]);

  // Klick außerhalb schließt Dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Flughafen auswählen
  const selectAirport = (airport) => {
    // Zeige den Namen oder Stadt, was besser ist
    const displayName = airport.name || airport.city;
    setQuery(`${displayName} (${airport.iata})`);
    setShowDropdown(false);
    onChange(airport.iata);
    setSelectedIndex(-1);
  };

  // Keyboard Navigation
  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        selectAirport(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setSelectedIndex(-1);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {label && (
        <label
          style={{
            display: 'block',
            marginBottom: '6px',
            fontWeight: '500',
            color: '#374151',
          }}
        >
          {label}
          {required && <span style={{ color: '#ef4444' }}> *</span>}
        </label>
      )}

      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        style={{
          width: '100%',
          padding: '10px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          fontSize: '15px',
          outline: 'none',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.target.style.borderColor = '#9ca3af';
        }}
        onMouseLeave={(e) => {
          if (document.activeElement !== e.target) {
            e.target.style.borderColor = '#d1d5db';
          }
        }}
        onFocusCapture={(e) => {
          e.target.style.borderColor = '#3b82f6';
          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
        }}
        onBlurCapture={(e) => {
          e.target.style.borderColor = '#d1d5db';
          e.target.style.boxShadow = 'none';
        }}
      />

      {/* Dropdown mit Vorschlägen */}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 1000,
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
            maxHeight: '320px',
            overflowY: 'auto',
          }}
        >
          {suggestions.map((airport, index) => {
            const isPopular = POPULAR_AIRPORTS.has(airport.iata);
            const isSelected = index === selectedIndex;

            return (
              <div
                key={airport.iata}
                onClick={() => selectAirport(airport)}
                onMouseEnter={() => setSelectedIndex(index)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderBottom:
                    index < suggestions.length - 1
                      ? '1px solid #f3f4f6'
                      : 'none',
                  background: isSelected ? '#f3f4f6' : 'white',
                  transition: 'background 0.15s',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: '600',
                      color: '#111827',
                      fontSize: '14px',
                      marginBottom: '2px',
                    }}
                  >
                    {airport.name || airport.city}
                    {isPopular && (
                      <span
                        style={{
                          marginLeft: '6px',
                          fontSize: '12px',
                          color: '#f59e0b',
                        }}
                      >
                        ⭐
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#6b7280',
                    }}
                  >
                    {airport.city}
                    {airport.country && ` • ${airport.country}`}
                  </div>
                </div>
                <div
                  style={{
                    fontWeight: '700',
                    color: '#3b82f6',
                    fontSize: '14px',
                    marginLeft: '12px',
                    flexShrink: 0,
                  }}
                >
                  {airport.iata}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Keine Ergebnisse */}
      {showDropdown && query.length >= 2 && suggestions.length === 0 && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 1000,
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
            padding: '20px',
            textAlign: 'center',
            color: '#9ca3af',
          }}
        >
          Keine Flughäfen gefunden
        </div>
      )}
    </div>
  );
}

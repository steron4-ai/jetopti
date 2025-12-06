// supabase/functions/simulate-price/index.ts
// ✅ V5 FINAL: Erstellt Jet-Objekt für pricing-engine-FINAL.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

console.log('simulate-price V5 FINAL started');

// Diese Typen müssen mit pricing-engine.ts übereinstimmen
interface Jet {
  id: string;
  name: string;
  type: string;
  seats: number;
  range: number;
  price_per_hour: number | null;
  min_booking_price: number | null;
  current_iata: string | null;
}

interface Airport {
  iata: string;
  city?: string;
  lat: number;
  lng: number;
}

interface PriceContext {
  mainDistanceKm: number;
  ferryDistanceKm?: number;
  jet: Jet;
  startAirport: Airport;
  destAirport: Airport;
  departureTime: Date;
  now?: Date;
  passengers?: number;
  isEmptyLeg?: boolean;
  isRoundtrip?: boolean;
  enforceMinPrice?: boolean;
}

interface SimulateRequest {
  jetType: string;
  pricePerHour: number;
  minPrice: number;
  fromIATA: string;
  toIATA: string;
  passengers: number;
  dateTime: string;
  roundtrip?: boolean;
  
  // FERRY-OPTIONEN
  includeFerry?: boolean;
  ferryFrom?: string;
  ferryTo?: string;
}

// Haversine Distanz-Berechnung
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Erdradius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Airport-Daten holen (vereinfacht - in Produktion aus DB)
async function getAirportData(iata: string): Promise<Airport | null> {
  // In Produktion: aus Datenbank laden
  // Für Simulator: temporäre Mock-Daten
  const mockAirports: { [key: string]: Airport } = {
    'FRA': { iata: 'FRA', city: 'Frankfurt', lat: 50.0379, lng: 8.5622 },
    'LHR': { iata: 'LHR', city: 'London', lat: 51.4700, lng: -0.4543 },
    'MUC': { iata: 'MUC', city: 'Munich', lat: 48.3538, lng: 11.7861 },
    'PRG': { iata: 'PRG', city: 'Prague', lat: 50.1008, lng: 14.2632 },
    'LEJ': { iata: 'LEJ', city: 'Leipzig', lat: 51.4239, lng: 12.2364 },
    'DXB': { iata: 'DXB', city: 'Dubai', lat: 25.2532, lng: 55.3657 },
    'CDG': { iata: 'CDG', city: 'Paris', lat: 49.0097, lng: 2.5479 },
    'PMI': { iata: 'PMI', city: 'Palma', lat: 39.5517, lng: 2.7388 },
  };
  
  return mockAirports[iata.toUpperCase()] || null;
}

// Dynamischer Import der pricing-engine
const { calculatePrice } = await import('../_shared/pricing-engine.ts');

serve(async (req) => {
  // CORS Headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const body: SimulateRequest = await req.json();
    console.log('📦 Simulator Request:', body);

    // Validierung
    if (!body.jetType || !body.pricePerHour || !body.fromIATA || !body.toIATA) {
      throw new Error('Fehlende Parameter');
    }

    // ✅ ERSTELLE JET-OBJEKT (kompatibel mit pricing-engine-FINAL.ts)
    const mockJet: Jet = {
      id: 'simulator-jet',
      name: `${body.jetType} Simulator`,
      type: body.jetType,
      seats: body.passengers,
      range: 5000, // Default range
      price_per_hour: body.pricePerHour,
      min_booking_price: body.minPrice,
      current_iata: body.includeFerry ? body.ferryFrom : body.fromIATA,
    };

    console.log('✈️ Jet-Objekt erstellt:', mockJet);

    let result: any;

    if (body.includeFerry && body.ferryFrom && body.ferryTo) {
      // MIT FERRY
      console.log('🔥 Ferry-Modus aktiviert');
      console.log(`🛫 Ferry: ${body.ferryFrom} → ${body.ferryTo}`);
      console.log(`🎯 Main: ${body.fromIATA} → ${body.toIATA}`);

      // Hole Airport-Daten
      const ferryStart = await getAirportData(body.ferryFrom);
      const ferryDest = await getAirportData(body.ferryTo);
      const mainStart = await getAirportData(body.fromIATA);
      const mainDest = await getAirportData(body.toIATA);

      if (!ferryStart || !ferryDest || !mainStart || !mainDest) {
        throw new Error('Airport nicht gefunden');
      }

      // Berechne Distanzen
      const ferryDistance = calculateDistance(
        ferryStart.lat, ferryStart.lng,
        ferryDest.lat, ferryDest.lng
      );
      const mainDistance = calculateDistance(
        mainStart.lat, mainStart.lng,
        mainDest.lat, mainDest.lng
      );

      console.log(`📏 Ferry-Distanz: ${Math.round(ferryDistance)} km`);
      console.log(`📏 Main-Distanz: ${Math.round(mainDistance)} km`);

      // ✅ BERECHNE MIT PRICING-ENGINE-FINAL.TS
      const departureTime = new Date(body.dateTime);
      const now = new Date();

      const priceContext: PriceContext = {
        ferryDistanceKm: ferryDistance,
        mainDistanceKm: mainDistance,
        jet: mockJet,
        startAirport: mainStart,
        destAirport: mainDest,
        departureTime,
        now,
        passengers: body.passengers,
        isRoundtrip: body.roundtrip || false,
        enforceMinPrice: true,
      };

      const priceResult = calculatePrice(priceContext);

      if (priceResult.totalPrice === Infinity) {
        throw new Error('Jet außerhalb der Reichweite');
      }

      // Berechne Main ohne Ferry für Vergleich
      const mainOnlyContext: PriceContext = {
        mainDistanceKm: mainDistance,
        jet: mockJet,
        startAirport: mainStart,
        destAirport: mainDest,
        departureTime,
        now,
        passengers: body.passengers,
        isRoundtrip: body.roundtrip || false,
        enforceMinPrice: true,
      };

      const mainOnlyResult = calculatePrice(mainOnlyContext);
      const ferryCost = priceResult.totalPrice - mainOnlyResult.totalPrice;

      result = {
        ok: true,
        
        // Ferry-Info
        ferry: {
          from: body.ferryFrom,
          to: body.ferryTo,
          distance_km: Math.round(ferryDistance),
          block_hours: priceResult.breakdown.block_ferry_h.toFixed(1),
          price: Math.round(ferryCost),
        },
        
        // Main-Info
        mainFlightPrice: Math.round(mainOnlyResult.totalPrice),
        distances: {
          main_km: Math.round(mainDistance),
        },
        timing: {
          block_hours: priceResult.breakdown.block_main_h.toFixed(1),
        },
        roundtrip: body.roundtrip || false,
        
        // Total
        totalPrice: Math.round(priceResult.totalPrice),
        
        // Vergleich
        comparison: {
          without_ferry: Math.round(mainOnlyResult.totalPrice),
          ferry_cost: Math.round(ferryCost),
          percent_increase: Math.round((ferryCost / mainOnlyResult.totalPrice) * 100),
        },
      };

      console.log('✅ Gesamt mit Ferry:', result.totalPrice, '€');
    } else {
      // OHNE FERRY
      console.log('📦 Standard-Modus (ohne Ferry)');

      // Hole Airport-Daten
      const startAirport = await getAirportData(body.fromIATA);
      const destAirport = await getAirportData(body.toIATA);

      if (!startAirport || !destAirport) {
        throw new Error('Airport nicht gefunden');
      }

      // Berechne Distanz
      const distance = calculateDistance(
        startAirport.lat, startAirport.lng,
        destAirport.lat, destAirport.lng
      );

      console.log(`📏 Distanz: ${Math.round(distance)} km`);

      // ✅ BERECHNE MIT PRICING-ENGINE-FINAL.TS
      const departureTime = new Date(body.dateTime);
      const now = new Date();

      const priceContext: PriceContext = {
        mainDistanceKm: distance,
        jet: mockJet,
        startAirport,
        destAirport,
        departureTime,
        now,
        passengers: body.passengers,
        isRoundtrip: body.roundtrip || false,
        enforceMinPrice: true,
      };

      const priceResult = calculatePrice(priceContext);

      if (priceResult.totalPrice === Infinity) {
        throw new Error('Jet außerhalb der Reichweite');
      }

      result = {
        ok: true,
        distances: {
          main_km: Math.round(distance),
        },
        timing: {
          block_hours: priceResult.breakdown.block_total_h.toFixed(1),
        },
        roundtrip: body.roundtrip || false,
        totalPrice: Math.round(priceResult.totalPrice),
      };

      console.log('✅ Standard berechnet:', result.totalPrice, '€');
    }

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('❌ Simulator Error:', error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: error.message || 'Interner Fehler',
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});

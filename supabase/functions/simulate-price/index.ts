// supabase/functions/simulate-price/index.ts
// ✅ Price Simulator V3 - Für Dashboard ohne JetId
// Nutzt Unified Pricing Engine wie direct-price-quote

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import {
  calculatePrice,
  calculateDistance,
  getCruiseSpeed,
  type Jet,
  type Airport,
} from '../_shared/pricing-engine.ts';

// ------------------------------------------------------------------
// TYPES
// ------------------------------------------------------------------
interface RequestBody {
  jetType: string;
  pricePerHour: number;
  minPrice: number;
  fromIATA: string;
  toIATA: string;
  passengers: number;
  dateTime: string;
  roundtrip: boolean;
}

// ------------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------------
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function toNumber(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// ------------------------------------------------------------------
// MAIN HANDLER
// ------------------------------------------------------------------
Deno.serve(async (req) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const {
    jetType,
    pricePerHour,
    minPrice,
    fromIATA,
    toIATA,
    passengers,
    dateTime,
    roundtrip,
  } = body;

  // Validierung
  if (!jetType || !fromIATA || !toIATA || !dateTime) {
    return json(
      { error: 'jetType, fromIATA, toIATA und dateTime sind Pflichtfelder.' },
      400
    );
  }

  if (pricePerHour <= 0) {
    return json({ error: 'pricePerHour muss größer als 0 sein.' }, 400);
  }

  console.log('🧮 Price Simulator V3:', { 
    jetType, 
    pricePerHour, 
    minPrice,
    fromIATA, 
    toIATA, 
    passengers, 
    roundtrip 
  });

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // 1) Airports laden
  const { data: airports, error: airportError } = await supabaseAdmin
    .from('airports')
    .select('iata, city, lat, lon')
    .in('iata', [fromIATA.toUpperCase(), toIATA.toUpperCase()]);

  if (airportError) {
    console.error('[simulate-price] Airport-Error:', airportError);
    return json({ error: 'Flughäfen konnten nicht geladen werden.' }, 500);
  }

  const findAirport = (iata: string): Airport | null => {
    const found = (airports || []).find(
      (a) => (a.iata || '').toUpperCase() === iata.toUpperCase()
    );
    if (!found) return null;
    return {
      iata: found.iata,
      city: found.city,
      lat: toNumber(found.lat),
      lon: toNumber(found.lon),
    };
  };

  const startAirport = findAirport(fromIATA);
  const destAirport = findAirport(toIATA);

  if (!startAirport || !destAirport) {
    return json(
      { error: `Start- oder Zielflughafen nicht gefunden: ${fromIATA}, ${toIATA}` },
      400
    );
  }

  // 2) Virtuellen Jet erstellen (aus Simulator-Parametern)
  const virtualJet: Jet = {
    id: 'simulator-virtual-jet',
    name: `Simulator ${jetType}`,
    type: jetType,
    seats: 12, // Für Simulator irrelevant (wird nicht gecheckt)
    range: 999999, // Unbegrenzte Reichweite im Simulator
    price_per_hour: pricePerHour,
    min_booking_price: minPrice,
    lead_time_hours: 0, // Keine Lead-Time-Checks im Simulator
    current_iata: fromIATA, // Jet steht am Startflughafen (kein Ferry)
    current_lat: startAirport.lat,
    current_lng: startAirport.lon,
    allow_empty_legs: false,
    empty_leg_discount: 0,
  };

  console.log('✅ Virtueller Jet erstellt:', virtualJet.type);

  // 3) Distanz berechnen
  const mainDistanceKm = calculateDistance(
    startAirport.lat,
    startAirport.lon,
    destAirport.lat,
    destAirport.lon
  );

  // Kein Ferry im Simulator (Jet steht immer am Start)
  const ferryDistanceKm = 0;

  console.log('📊 Distanz:', mainDistanceKm.toFixed(0), 'km');

  // 4) Zeitberechnung
  const departure = new Date(dateTime);
  const now = new Date();

  if (isNaN(departure.getTime())) {
    return json({ error: 'Ungültiges dateTime Format.' }, 400);
  }

  // 5) Preis berechnen mit Unified Pricing Engine
  const priceResult = calculatePrice({
    mainDistanceKm,
    ferryDistanceKm,
    jet: virtualJet,
    startAirport,
    destAirport,
    departureTime: departure,
    now,
    passengers: Math.max(1, toNumber(passengers, 1)),
    isEmptyLeg: false,
    isRoundtrip: !!roundtrip,
    enforceMinPrice: true,
  });

  console.log('✅ Preis berechnet:', priceResult.totalPrice, '€');
  console.log('📈 Breakdown:', priceResult.breakdown);

  // 6) Blockzeit berechnen für Anzeige
  const cruiseSpeed = getCruiseSpeed(virtualJet);
  let blockHours = mainDistanceKm / cruiseSpeed + 0.4; // Taxi/Climb
  if (roundtrip) {
    blockHours *= 1.8; // Roundtrip-Aufschlag
  }

  // 7) Response
  return json({
    ok: true,
    price: priceResult.totalPrice,
    breakdown: priceResult.breakdown,
    distances: {
      main_km: Math.round(mainDistanceKm),
      ferry_km: 0,
    },
    timing: {
      block_hours: Math.round(blockHours * 10) / 10,
    },
    route: {
      from: {
        iata: startAirport.iata,
        city: startAirport.city,
      },
      to: {
        iata: destAirport.iata,
        city: destAirport.city,
      },
    },
    simulator_params: {
      jet_type: jetType,
      hourly_rate: pricePerHour,
      min_price: minPrice,
    },
    roundtrip: !!roundtrip,
  });
});
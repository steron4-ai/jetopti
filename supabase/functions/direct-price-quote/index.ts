// supabase/functions/direct-price-quote/index.ts
// ✅ Direct Price Quote V3 - Nutzt Unified Pricing Engine

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import {
  calculatePrice,
  calculateDistance,
  getCruiseSpeed,
  getFallbackHourlyRate,
  type Jet,
  type Airport,
} from '../_shared/pricing-engine.ts';

// ------------------------------------------------------------------
// ENV & HELPERS
// ------------------------------------------------------------------
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('PROJECT_URL') ?? '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SERVICE_ROLE_KEY') ?? '';

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
// TYPES
// ------------------------------------------------------------------
interface JetRow {
  id: string;
  name: string | null;
  type: string | null;
  seats: number | null;
  range: number | null;
  price_per_hour: number | null;
  min_booking_price: number | null;
  lead_time_hours: number | null;
  current_iata: string | null;
}

interface RequestBody {
  jetId: string;
  fromIATA: string;
  toIATA: string;
  passengers?: number;
  dateTime: string;
  roundtrip?: boolean;
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
    jetId,
    fromIATA,
    toIATA,
    passengers = 1,
    dateTime,
    roundtrip = false,
  } = body;

  // Pflichtfelder prüfen
  if (!jetId || !fromIATA || !toIATA || !dateTime) {
    return json(
      { error: 'jetId, fromIATA, toIATA und dateTime sind Pflichtfelder.' },
      400
    );
  }

  console.log('🚀 Direct Price Quote V3:', { jetId, fromIATA, toIATA, passengers, roundtrip });

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // 1) Jet laden
  const { data: jetRow, error: jetError } = await supabaseAdmin
    .from('jets')
    .select('id, name, type, seats, range, price_per_hour, min_booking_price, lead_time_hours, current_iata')
    .eq('id', jetId)
    .maybeSingle();

  if (jetError) {
    console.error('[direct-price-quote] Jet-Error:', jetError);
    return json({ error: 'Jet konnte nicht geladen werden.' }, 500);
  }
  if (!jetRow) {
    return json({ error: 'Jet nicht gefunden.' }, 404);
  }

  // Jet-Objekt für Pricing Engine
  const jet: Jet = {
    id: jetRow.id,
    name: jetRow.name || 'Unbekannt',
    type: jetRow.type || 'Midsize Jet',
    seats: jetRow.seats || 6,
    range: jetRow.range || 4000,
    price_per_hour: jetRow.price_per_hour,
    min_booking_price: jetRow.min_booking_price,
    lead_time_hours: jetRow.lead_time_hours,
    current_iata: jetRow.current_iata,
  };

  // 2) Airports laden
  const iatas = [fromIATA.toUpperCase(), toIATA.toUpperCase()];
  if (jet.current_iata) {
    iatas.push(jet.current_iata.toUpperCase());
  }

  const { data: airports, error: airportError } = await supabaseAdmin
    .from('airports')
    .select('iata, city, lat, lon')
    .in('iata', [...new Set(iatas)]); // Deduplicate

  if (airportError) {
    console.error('[direct-price-quote] Airport-Error:', airportError);
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
      { error: 'Start- oder Zielflughafen nicht gefunden.' },
      400
    );
  }

  // Jet-Basis (für Ferry-Berechnung)
  const baseAirport = jet.current_iata ? findAirport(jet.current_iata) : null;

  // 3) Distanzen berechnen
  const mainDistanceKm = calculateDistance(
    startAirport.lat,
    startAirport.lon,
    destAirport.lat,
    destAirport.lon
  );

  let ferryDistanceKm = 0;
  if (baseAirport && baseAirport.iata.toUpperCase() !== fromIATA.toUpperCase()) {
    ferryDistanceKm = calculateDistance(
      baseAirport.lat,
      baseAirport.lon,
      startAirport.lat,
      startAirport.lon
    );
  }

  console.log('📊 Distanzen:', {
    main: mainDistanceKm.toFixed(0) + 'km',
    ferry: ferryDistanceKm.toFixed(0) + 'km',
  });

  // 4) Reichweiten-Check (nur Hauptstrecke)
  if (jet.range && jet.range > 0 && mainDistanceKm > jet.range) {
    return json(
      {
        error: `Dieser Jet kann diese Strecke nicht fliegen (Reichweite ${jet.range} km, Strecke ${mainDistanceKm.toFixed(0)} km).`,
        code: 'OUT_OF_RANGE',
      },
      400
    );
  }

  // 5) Lead-Time-Check
  const departure = new Date(dateTime);
  const now = new Date();
  const hoursUntilFlight = (departure.getTime() - now.getTime()) / 3600000;

  const cruiseSpeed = getCruiseSpeed(jet);
  const ferryHours = ferryDistanceKm > 0 ? ferryDistanceKm / cruiseSpeed : 0;
  const jetLeadTime = jet.lead_time_hours ?? 4;
  const requiredLeadTime = jetLeadTime + ferryHours;

  if (hoursUntilFlight < requiredLeadTime) {
    return json(
      {
        error: `Dieser Jet benötigt mindestens ${requiredLeadTime.toFixed(1)} Stunden Vorlaufzeit (inkl. Positionierungsflug). Bitte Abflugzeit anpassen.`,
        code: 'LEAD_TIME_TOO_SHORT',
        hoursUntilFlight: Math.round(hoursUntilFlight * 10) / 10,
        requiredLeadTime: Math.round(requiredLeadTime * 10) / 10,
      },
      400
    );
  }

  // 6) Preis berechnen mit Unified Pricing Engine
  const priceResult = calculatePrice({
    mainDistanceKm,
    ferryDistanceKm,
    jet,
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

  // 7) Response
  return json({
    ok: true,
    price: priceResult.totalPrice,
    breakdown: priceResult.breakdown,
    distances: {
      main_km: Math.round(mainDistanceKm),
      ferry_km: Math.round(ferryDistanceKm),
      total_km: Math.round(mainDistanceKm + ferryDistanceKm),
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
    jet: {
      id: jet.id,
      name: jet.name,
      type: jet.type,
      hourly_rate: jet.price_per_hour || getFallbackHourlyRate(jet),
    },
    timing: {
      departure: dateTime,
      hours_until_flight: Math.round(hoursUntilFlight * 10) / 10,
      required_lead_time: Math.round(requiredLeadTime * 10) / 10,
    },
    roundtrip: !!roundtrip,
  });
});
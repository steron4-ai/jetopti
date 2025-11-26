// supabase/functions/direct-price-quote/index.ts
// ✅ Pricing Engine V2 für Direktbuchungen (geheimes "Coca-Cola"-Rezept)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// ------------------------------------------------------------------
// ENV
// ------------------------------------------------------------------
const SUPABASE_URL = Deno.env.get('PROJECT_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!;
// ------------------------------------------------------------------
// Helper
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

// Haversine-Distanz in km
function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ------------------------------------------------------------------
// Pricing Engine V2
// ------------------------------------------------------------------

type JetRow = {
  id: string;
  name: string | null;
  type: string | null;
  seats: number | null;
  range: number | null;
  price_per_hour: number | null;
  min_booking_price: number | null;
  lead_time_hours: number | null;
  current_iata: string | null;
};

// Typische Cruise-Speeds nach Jet-Klasse (km/h)
const CRUISE_SPEED_BY_CLASS: Record<string, number> = {
  very_light: 620,
  light: 720,
  super_light: 760,
  midsize: 800,
  super_midsize: 830,
  heavy: 850,
  ultra_long_range: 900,
};

// Fallback-Hourly-Rates (EUR/h) für den Fall, dass price_per_hour leer ist
function getFallbackHourlyRate(jet: JetRow): number {
  const t = (jet.type || '').toLowerCase();
  if (t.includes('very light')) return 2500;
  if (t.includes('light jet') && !t.includes('super')) return 3500;
  if (t.includes('super light')) return 4000;
  if (t.includes('midsize') && !t.includes('super')) return 4500;
  if (t.includes('super midsize')) return 5500;
  if (t.includes('heavy')) return 7000;
  if (t.includes('ultra long')) return 9000;
  return 4000;
}

function getCruiseSpeed(jet: JetRow): number {
  const t = (jet.type || '').toLowerCase();
  if (t.includes('very light')) return CRUISE_SPEED_BY_CLASS.very_light;
  if (t.includes('light jet') && !t.includes('super')) return CRUISE_SPEED_BY_CLASS.light;
  if (t.includes('super light')) return CRUISE_SPEED_BY_CLASS.super_light;
  if (t.includes('midsize') && !t.includes('super')) return CRUISE_SPEED_BY_CLASS.midsize;
  if (t.includes('super midsize')) return CRUISE_SPEED_BY_CLASS.super_midsize;
  if (t.includes('heavy')) return CRUISE_SPEED_BY_CLASS.heavy;
  if (t.includes('ultra long')) return CRUISE_SPEED_BY_CLASS.ultra_long_range;
  return 780; // Default
}

// Blockzeit (inkl. Taxi, Steigflug etc.)
function calcBlockHours(distanceKm: number, cruiseSpeed: number, minBlock: number): number {
  if (distanceKm <= 0) return 0;
  const pure = distanceKm / cruiseSpeed;
  // +0.4h für Taxi/Climb/Approach, mind. minBlock
  return Math.max(pure + 0.4, minBlock);
}

// Premium-Airports (für Demand-Bonus)
const PREMIUM_AIRPORTS = new Set<string>([
  'LHR', 'LGW', 'LCY',
  'CDG', 'NCE', 'LBG',
  'FRA', 'MUC', 'ZRH', 'GVA', 'VIE',
  'IBZ', 'OLB', 'PMI',
  'JFK', 'EWR', 'LAX', 'SFO', 'LAS',
  'DXB', 'DOH', 'HKG', 'SIN',
]);

type PriceInput = {
  jet: JetRow;
  mainDistanceKm: number;
  ferryDistanceKm: number;
  passengers: number;
  departureIso: string;
  fromIata: string;
  toIata: string;
  isRoundtrip: boolean;
};

type PriceBreakdown = {
  block_main_h: number;
  block_ferry_h: number;
  block_total_h: number;
  hourly_rate: number;
  flight_cost: number;
  crew_cost: number;
  landing_fees: number;
  passenger_fees: number;
  demand_factor: number;
  demand_reason: string[];
  min_price_applied: number;
};

function calculatePriceV2(input: PriceInput): { totalPrice: number; breakdown: PriceBreakdown } {
  const {
    jet,
    mainDistanceKm,
    ferryDistanceKm,
    passengers,
    departureIso,
    fromIata,
    toIata,
    isRoundtrip,
  } = input;

  const cruiseSpeed = getCruiseSpeed(jet);
  const hourlyRate = jet.price_per_hour ?? getFallbackHourlyRate(jet);
  const minPrice = jet.min_booking_price ?? 5000;

  // Blockzeiten
  const blockMain = calcBlockHours(mainDistanceKm, cruiseSpeed, 1.0);
  const blockFerry = ferryDistanceKm > 0 ? calcBlockHours(ferryDistanceKm, cruiseSpeed, 0.7) : 0;
  let blockTotal = blockMain + blockFerry;

  // Roundtrip als Multiplikator (~80% Aufschlag)
  if (isRoundtrip) {
    blockTotal *= 1.8;
  }

  const flightCost = blockTotal * hourlyRate;

  // Crew: ca. 500€ pro 4 Blockstunden
  const crewCost = 500 * Math.max(1, Math.ceil(blockTotal / 4));

  // Landings: 400€ pro Leg (Hin/Rück)
  const legs = isRoundtrip ? 2 : 1;
  const landingFees = 400 * legs;

  // Zusätzliche Pax-Fee ab dem 5. Passagier
  const pax = Math.max(1, passengers || 1);
  const passengerFees = pax > 4 ? (pax - 4) * 150 : 0;

  let demandFactor = 1.0;
  const demandReason: string[] = [];

  const dep = new Date(departureIso);
  if (!Number.isNaN(dep.getTime())) {
    const dow = dep.getUTCDay(); // 0 = So, 6 = Sa
    const month = dep.getUTCMonth() + 1;

    const isWeekend = dow === 5 || dow === 6 || dow === 0;
    const isSummer = month === 7 || month === 8;
    const isXmas = month === 12;

    if (isWeekend) {
      demandFactor += 0.1;
      demandReason.push('Weekend');
    }
    if (isSummer) {
      demandFactor += 0.05;
      demandReason.push('Sommer');
    }
    if (isXmas) {
      demandFactor += 0.1;
      demandReason.push('Weihnachten/Neujahr');
    }
  }

  const fromUp = fromIata.toUpperCase();
  const toUp = toIata.toUpperCase();
  if (PREMIUM_AIRPORTS.has(fromUp) || PREMIUM_AIRPORTS.has(toUp)) {
    demandFactor += 0.15;
    demandReason.push('Premium-Airport');
  }

  let basePrice =
    flightCost +
    crewCost +
    landingFees +
    passengerFees;

  basePrice *= demandFactor;

  const total = Math.max(basePrice, minPrice);
  const minApplied = total === minPrice ? minPrice : 0;

  return {
    totalPrice: Math.round(total),
    breakdown: {
      block_main_h: blockMain,
      block_ferry_h: blockFerry,
      block_total_h: blockTotal,
      hourly_rate: hourlyRate,
      flight_cost: flightCost,
      crew_cost: crewCost,
      landing_fees: landingFees,
      passenger_fees: passengerFees,
      demand_factor: demandFactor,
      demand_reason: demandReason,
      min_price_applied: minApplied,
    },
  };
}

// ------------------------------------------------------------------
// MAIN
// ------------------------------------------------------------------
Deno.serve(async (req) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let body: any;
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
  } = body || {};

  if (!jetId || !fromIATA || !toIATA || !dateTime) {
    return json(
      {
        error: 'jetId, fromIATA, toIATA und dateTime sind Pflichtfelder.',
      },
      400,
    );
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Jet laden
  const { data: jet, error: jetError } = await supabaseAdmin
    .from('jets')
    .select(
      'id, name, type, seats, range, price_per_hour, min_booking_price, lead_time_hours, current_iata',
    )
    .eq('id', jetId)
    .maybeSingle();

  if (jetError) {
    console.error('[direct-price-quote] Jet-Select-Error:', jetError);
    return json({ error: 'Jet konnte nicht geladen werden.' }, 500);
  }
  if (!jet) {
    return json({ error: 'Jet nicht gefunden.' }, 404);
  }

  // Airports laden: Start, Ziel und ggf. aktueller Standort des Jets
  const iatas = [fromIATA.toUpperCase(), toIATA.toUpperCase()];
  if (jet.current_iata) {
    iatas.push(jet.current_iata.toUpperCase());
  }

  const { data: airports, error: airportError } = await supabaseAdmin
    .from('airports')
    .select('iata, lat, lon')
    .in('iata', iatas);

  if (airportError) {
    console.error('[direct-price-quote] Airport-Select-Error:', airportError);
    return json({ error: 'Flughäfen konnten nicht geladen werden.' }, 500);
  }

  const findAp = (iata: string) =>
    (airports || []).find((a) => (a.iata || '').toUpperCase() === iata.toUpperCase()) || null;

  const start = findAp(fromIATA);
  const dest = findAp(toIATA);

  if (!start || !dest) {
    return json(
      {
        error: 'Start- oder Zielflughafen konnte nicht gefunden werden.',
      },
      400,
    );
  }

  const base = jet.current_iata ? findAp(jet.current_iata) : null;

  const mainDistanceKm = distanceKm(
    toNumber(start.lat),
    toNumber(start.lon),
    toNumber(dest.lat),
    toNumber(dest.lon),
  );

  let ferryDistanceKm = 0;
  if (base && base.iata.toUpperCase() !== fromIATA.toUpperCase()) {
    ferryDistanceKm = distanceKm(
      toNumber(base.lat),
      toNumber(base.lon),
      toNumber(start.lat),
      toNumber(start.lon),
    );
  }

  const paxNum = Number.isFinite(Number(passengers)) ? Number(passengers) : 1;

  const pricing = calculatePriceV2({
    jet,
    mainDistanceKm,
    ferryDistanceKm,
    passengers: paxNum,
    departureIso: dateTime,
    fromIata: fromIATA.toUpperCase(),
    toIata: toIATA.toUpperCase(),
    isRoundtrip: !!roundtrip,
  });

  return json({
    ok: true,
    price: pricing.totalPrice,
    breakdown: pricing.breakdown,
    mainDistanceKm,
    ferryDistanceKm,
  });
});

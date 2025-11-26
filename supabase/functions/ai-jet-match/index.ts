// supabase/functions/ai-jet-match/index.ts
// ✅ AI Jet Match mit Airports aus DB + JetOpti Pricing Engine V2 (Coca-Cola-Rezept)
// + ✨ Realistische Reichweiten-Logik (Main vs Ferry vs Total)

// @ts-ignore
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

interface Jet {
  id: string;
  name: string;
  type: string;
  seats: number;
  range: number;
  status: string;
  current_iata: string | null;
  current_lat: number | null;
  current_lng: number | null;
  lead_time_hours: number | null;
  min_booking_price: number | null;
  home_base_iata: string | null;
  year_built: number | null;
  image_url: string | null;
  gallery_urls: string[] | null;
  company_id: string;
  allow_empty_legs: boolean;
  empty_leg_discount: number;
  price_per_hour: number | null; // 💰 Stundenpreis aus Jets-Tabelle
}

interface Airport {
  iata: string;
  city: string;
  lat: number;
  lon: number;
}

interface RequestBody {
  fromIATA: string;
  toIATA: string;
  passengers: number;
  dateTime: string;
}

// --------------------------------------------------------
// GEO-HELPER
// --------------------------------------------------------
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// --------------------------------------------------------
// JETOPTI PRICING ENGINE V2 (Coca-Cola-Rezept)
// --------------------------------------------------------

// realistische Cruise-Speeds nach Jet-Segment
function getCruiseSpeedKmH(jet: Jet): number {
  const t = (jet.type || '').toLowerCase();
  if (t.includes('very light')) return 620;
  if (t.includes('light') && !t.includes('super')) return 700;
  if (t.includes('super light')) return 740;
  if (t.includes('midsize') && !t.includes('super')) return 780;
  if (t.includes('super midsize')) return 820;
  if (t.includes('heavy')) return 860;
  if (t.includes('ultra long')) return 900;
  if (t.includes('bbj') || t.includes('lineage') || t.includes('acj')) return 880;
  // Fallback
  return 780;
}

// Mindest-Blockzeit je Segment (Industrie-Standard)
function getMinBlockHours(jet: Jet): number {
  const t = (jet.type || '').toLowerCase();
  if (t.includes('very light')) return 1.0;
  if (t.includes('light')) return 1.5;
  if (t.includes('super light')) return 1.5;
  if (t.includes('midsize') && !t.includes('super')) return 2.0;
  if (t.includes('super midsize')) return 2.0;
  if (t.includes('heavy')) return 2.5;
  if (t.includes('ultra long')) return 3.0;
  return 1.5;
}

// Crew Fee (Duty Time > 4h)
function calculateCrewFee(billableHours: number, jet: Jet): number {
  if (billableHours <= 4) return 0;
  const t = (jet.type || '').toLowerCase();
  let crewCount = 2;
  if (t.includes('heavy') || t.includes('ultra long')) {
    crewCount = 3; // Langstrecke oft 3 Piloten
  }
  const crewBase = 400; // €/Crew – konservativ
  return crewCount * crewBase;
}

// Premium-Airports für höhere Gebühren / Nachfrage
const PREMIUM_AIRPORTS = new Set([
  'LHR', 'LGW', 'LCY', 'CDG', 'ORY',
  'FRA', 'MUC', 'DXB', 'DWC', 'DOH',
  'JED', 'RUH', 'HKG', 'SIN', 'NRT',
  'JFK', 'EWR', 'LGA', 'LAX', 'VNY',
  'MIA', 'SFO', 'LAS',
  // ✨ Sommer-/Luxury-Hotspots
  'NCE', // Nizza
  'IBZ', // Ibiza
  'OLB'  // Olbia / Costa Smeralda
]);


// Landing Fees abhängig von Airport-Größe (stark vereinfacht)
function getAirportLandingFee(airport: Airport): number {
  const code = (airport.iata || '').toUpperCase();
  if (PREMIUM_AIRPORTS.has(code)) return 900; // Premium Hubs
  // Kleine / mittlere Airports
  return 350;
}

function calculateLandingFees(start: Airport, dest: Airport): number {
  return getAirportLandingFee(start) + getAirportLandingFee(dest);
}

// Demand-Faktoren (Weekend, Last-Minute, Long-Haul, Premium-Route)
function calculateDemandFactor(
  mainDistanceKm: number,
  start: Airport,
  dest: Airport,
  departureTime: Date,
  now: Date,
  isEmptyLeg: boolean
): number {
  let factor = 1.0;

  const startCode = (start.iata || '').toUpperCase();
  const destCode = (dest.iata || '').toUpperCase();

  const hoursUntilFlight = (departureTime.getTime() - now.getTime()) / 3600000;

  const isWeekend = [5, 6, 0].includes(departureTime.getUTCDay()); // Fr, Sa, So
  const isPremiumRoute = PREMIUM_AIRPORTS.has(startCode) || PREMIUM_AIRPORTS.has(destCode);
  const isLongHaul = mainDistanceKm > 6000; // grob interkontinental

  // Empty Legs sollen attraktiv sein → weniger Aufschläge
  if (!isEmptyLeg) {
    if (isWeekend) factor += 0.10;
    if (hoursUntilFlight < 24) factor += 0.20; // Last Minute
    if (isLongHaul) factor += 0.10;
  }

  if (isPremiumRoute) {
    factor += 0.15; // z.B. LHR, JFK, DXB
  }

  return factor;
}

type PriceContext = {
  mainDistanceKm: number;
  ferryDistanceKm?: number;
  jet: Jet;
  startAirport: Airport;
  destAirport: Airport;
  departureTime: Date;
  now: Date;
  isEmptyLeg?: boolean;
  enforceMinPrice?: boolean;
};

/**
 * JetOpti Pricing Engine V2
 * - Basis: Operator-Hourly-Rate (price_per_hour)
 * - Blocktime (inkl. Positioning) × Stundenpreis
 * - Mindestpreis, Crew Fees, Landing Fees, Demand-Faktoren
 */
function calculatePriceV2(ctx: PriceContext): number {
  const {
    mainDistanceKm,
    ferryDistanceKm = 0,
    jet,
    startAirport,
    destAirport,
    departureTime,
    now,
    isEmptyLeg = false,
    enforceMinPrice = true
  } = ctx;

  const cruise = getCruiseSpeedKmH(jet);
  const hourlyRate = jet.price_per_hour || 0;

  if (!hourlyRate || hourlyRate <= 0) {
    // Jet ohne gültigen Stundenpreis → nicht buchbar
    return Number.POSITIVE_INFINITY;
  }

  const mainHours = mainDistanceKm > 0 ? mainDistanceKm / cruise : 0;
  const ferryHours = ferryDistanceKm > 0 ? ferryDistanceKm / cruise : 0;

  let billableHours = mainHours + ferryHours;

  // Mindestblockzeit je Segment
  const minBlock = getMinBlockHours(jet);
  if (billableHours < minBlock) {
    billableHours = minBlock;
  }

  // Basiskosten
  let total = billableHours * hourlyRate;

  // Crew Fee
  const crewFee = calculateCrewFee(billableHours, jet);
  total += crewFee;

  // Landing Fees (Start + Ziel)
  const landingFees = calculateLandingFees(startAirport, destAirport);
  total += landingFees;

  // Nachfrage-Faktoren
  const demandFactor = calculateDemandFactor(
    mainDistanceKm,
    startAirport,
    destAirport,
    departureTime,
    now,
    isEmptyLeg
  );
  total *= demandFactor;

  // Mindestpreis nur für reguläre Buchungen
  if (enforceMinPrice && jet.min_booking_price && jet.min_booking_price > 0) {
    if (total < jet.min_booking_price) {
      total = jet.min_booking_price;
    }
  }

  // Für Empty Legs: besser auf glatte Beträge runden
  return Math.round(total);
}

// --------------------------------------------------------
// MAIN HANDLER
// --------------------------------------------------------
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 AI Jet Match gestartet (Pricing Engine V2)');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('✅ Supabase Client erstellt');

    // 1) Flughäfen aus DB
    const { data: airportsRaw, error: airportsError } = await supabaseAdmin
      .from('airports')
      .select('iata, city, lat, lon');

    if (airportsError) {
      console.error('❌ Airports-DB-Error:', airportsError);
      throw new Error(`Airport-Daten konnten nicht geladen werden: ${airportsError.message}`);
    }

    if (!airportsRaw || airportsRaw.length === 0) {
      throw new Error('Keine Flughäfen in der Datenbank gefunden.');
    }

    // ✨ NEU: defensiv normalisieren
    const airports: Airport[] = airportsRaw.map((a: any) => ({
      iata: a.iata,
      city: a.city,
      lat: Number(a.lat),
      lon: Number(a.lon),
    }));

    console.log('✅ Flughäfen verfügbar:', airports.length);

    // 2) Request einlesen
    const body: RequestBody = await req.json();
    const { fromIATA, toIATA, passengers, dateTime } = body;

    console.log('📥 Anfrage:', { fromIATA, toIATA, passengers, dateTime });

    const startAirport = airports.find(
      (a: Airport) => a.iata.toUpperCase() === fromIATA.toUpperCase()
    );
    const destAirport = airports.find(
      (a: Airport) => a.iata.toUpperCase() === toIATA.toUpperCase()
    );

    console.log(
      '🛫 Start-Airport:',
      startAirport ? `${startAirport.city} (${startAirport.iata})` : 'NICHT GEFUNDEN'
    );
    console.log(
      '🛬 Ziel-Airport:',
      destAirport ? `${destAirport.city} (${destAirport.iata})` : 'NICHT GEFUNDEN'
    );

    if (!startAirport || !destAirport) {
      throw new Error(
        `Start- oder Zielflughafen nicht gefunden. Start: ${fromIATA}, Ziel: ${toIATA}`
      );
    }

    // 3) Verfügbare Jets laden
    const { data: jetsData, error: jetsError } = await supabaseAdmin
      .from('jets')
      .select(
        `
        *,
        company_jets!inner(company_id)
      `
      )
      .eq('status', 'verfügbar');

    if (jetsError) throw jetsError;

    if (!jetsData || jetsData.length === 0) {
      throw new Error('Keine verfügbaren Jets in der Datenbank gefunden.');
    }

    console.log('✅ Jets gefunden:', jetsData.length);

    // 4) Route & Zeit
    const routeDistance = calculateDistance(
      startAirport.lat,
      startAirport.lon,
      destAirport.lat,
      destAirport.lon
    );
    const departureTime = new Date(dateTime);
    const now = new Date();

    console.log('📊 Route-Distanz:', routeDistance.toFixed(0), 'km');
    console.log(
      '⏰ Stunden bis Abflug:',
      ((departureTime.getTime() - now.getTime()) / 3600000).toFixed(1),
      'h'
    );

    // 5) Jets filtern & bewerten
    const candidates = (jetsData as any[])
      .map((jetRow: any) => {
        const jet: Jet = {
          ...jetRow,
          company_id: jetRow.company_jets[0]?.company_id,
          gallery_urls:
            typeof jetRow.gallery_urls === 'string'
              ? JSON.parse(jetRow.gallery_urls)
              : jetRow.gallery_urls,
          allow_empty_legs: jetRow.allow_empty_legs || false,
          empty_leg_discount: jetRow.empty_leg_discount || 50,
          price_per_hour: jetRow.price_per_hour ?? null
        };

        // Ohne gültigen Stundenpreis → nicht matchen
        if (!jet.price_per_hour || jet.price_per_hour <= 0) {
          console.warn('[SKIP] Jet ohne gültigen Stundenpreis:', jet.name, jet.id);
          return null;
        }

        // Ohne Position → nicht matchen
        if (
          jet.current_lat == null ||
          jet.current_lng == null ||
          Number.isNaN(jet.current_lat) ||
          Number.isNaN(jet.current_lng)
        ) {
          console.warn(
            '[SKIP] Jet ohne gültige Position:',
            jet.name,
            jet.id,
            jet.current_lat,
            jet.current_lng
          );
          return null;
        }

        const ferryDistanceKm = calculateDistance(
          startAirport.lat,
          startAirport.lon,
          jet.current_lat,
          jet.current_lng
        );

        // gleiche Lead-Time-Logik wie bisher (für Matching)
        const ferryFlightDurationHours = ferryDistanceKm / 800;
        const totalLeadTimeHours = (jet.lead_time_hours || 4) + ferryFlightDurationHours;
        const hoursUntilFlight =
          (departureTime.getTime() - now.getTime()) / 3600000;

        // --------------------------------------------------------
        // ✨ NEU: Reichweiten-Prüfung (realistisch)
        // --------------------------------------------------------
        
        // 1) Hauptstrecke darf nicht größer sein als Reichweite
        if (routeDistance > jet.range) {
          console.log("[SKIP] Hauptstrecke außerhalb der Reichweite", {
            jet: jet.name,
            routeDistance,
            jetRange: jet.range
          });
          return null;
        }

        // 2) Anflugdistanz darf max. 60% der Reichweite sein
        if (ferryDistanceKm > jet.range * 0.6) {
          console.log("[SKIP] Anflugdistanz zu weit", {
            jet: jet.name,
            ferryDistanceKm,
            maxAllowed: jet.range * 0.6
          });
          return null;
        }

        // 3) Kombination Hauptstrecke + Anflug muss realistisch sein
        if ((routeDistance + ferryDistanceKm) > jet.range * 0.85) {
          console.log("[SKIP] Gesamtflug (Route + Ferry) zu weit", {
            jet: jet.name,
            routeDistance,
            ferryDistanceKm,
            jetRange: jet.range
          });
          return null;
        }

        // --------------------------------------------------------
        // ENDE NEU: Reichweiten-Prüfung
        // --------------------------------------------------------

        const isSuitable =
          jet.seats >= passengers &&
          // jet.range >= routeDistance && // Entfernt, da oben bereits strikter geprüft
          hoursUntilFlight >= totalLeadTimeHours;

        if (!isSuitable) {
          console.log('[FILTER-OUT]', {
            jet: jet.name,
            seatsOk: jet.seats >= passengers,
            leadTimeOk: hoursUntilFlight >= totalLeadTimeHours,
            seats: jet.seats,
            hoursUntilFlight,
            totalLeadTimeHours
          });
          return null;
        }

        // ✨ NEU: Preis mit Pricing Engine V2
        const price = calculatePriceV2({
          mainDistanceKm: routeDistance,
          ferryDistanceKm,
          jet,
          startAirport,
          destAirport,
          departureTime,
          now,
          isEmptyLeg: false,
          enforceMinPrice: true
        });

        // ✨ Empty-Leg-Infos auch mit V2 berechnet
        let emptyLegInfo: any = null;
        if (jet.allow_empty_legs && ferryDistanceKm > 0) {
          const jetLocationAirport =
            airports.find(
              (a: Airport) =>
                a.iata.toUpperCase() === (jet.current_iata || '').toUpperCase()
            ) || startAirport;

          const normalEmptyLegPrice = calculatePriceV2({
            mainDistanceKm: ferryDistanceKm,
            ferryDistanceKm: 0,
            jet,
            startAirport: jetLocationAirport,
            destAirport: startAirport,
            departureTime,
            now,
            isEmptyLeg: true,
            enforceMinPrice: false // Empty Legs dürfen unter Mindestpreis sein
          });

          const discount = jet.empty_leg_discount || 50;
          const discountedPrice = Math.round(
            normalEmptyLegPrice * (1 - discount / 100)
          );

          emptyLegInfo = {
            shouldCreateEmptyLeg: true,
            ferryRoute: {
              from_iata: jet.current_iata,
              from_lat: jet.current_lat,
              from_lng: jet.current_lng,
              to_iata: startAirport.iata,
              to_lat: startAirport.lat,
              to_lng: startAirport.lon
            },
            ferryDistanceKm,
            discount,
            normalPrice: normalEmptyLegPrice,
            discountedPrice
          };
        }

        return {
          jet,
          ferryDistanceKm,
          totalLeadTimeHours,
          price,
          emptyLegInfo
        };
      })
      .filter(Boolean) as any[];

    console.log('✅ Geeignete Jets gefunden:', candidates.length);

    if (candidates.length === 0) {
      const hoursUntilFlight =
        (departureTime.getTime() - now.getTime()) / 3600000;
      throw new Error(
        `Kein passender Jet gefunden. Stunden bis Abflug: ${hoursUntilFlight.toFixed(
          1
        )}h. Bitte wählen Sie eine spätere Abflugzeit (mindestens 6–8 Stunden), passen Sie die Passagierzahl an oder wählen Sie eine andere Route.`
      );
    }

    candidates.sort((a: any, b: any) => a.price - b.price);
    const bestMatch = candidates[0];

    console.log('✅ Bester Match:', bestMatch.jet.name);
    if (bestMatch.emptyLegInfo) {
      console.log('🔥 Empty Leg Info:', bestMatch.emptyLegInfo);
    }

    const response = {
      ...bestMatch,
      fromIATA: startAirport.iata,
      toIATA: destAirport.iata,
      fromLocation: startAirport.city,
      toLocation: destAirport.city
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    const errorStack = error instanceof Error ? error.stack : 'Kein Stack';

    console.error('❌ FEHLER in Edge Function (AI Jet Match V2):', errorMessage);
    console.error('📍 Stack:', errorStack);

    return new Response(
      JSON.stringify({
        error: errorMessage,
        type: (error as any)?.constructor?.name || 'Unknown',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
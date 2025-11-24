// supabase/functions/ai-jet-match/index.ts
// ✅ AI Jet Match mit Airports aus DB (9000+ Flughäfen) + Empty-Leg-Infos

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
  current_lat: number;
  current_lng: number;
  lead_time_hours: number;
  min_booking_price: number;
  home_base_iata: string | null;
  year_built: number | null;
  image_url: string | null;
  gallery_urls: string[] | null;
  company_id: string;
  allow_empty_legs: boolean;
  empty_leg_discount: number;
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

function calculatePrice(distanceKm: number, jet: Jet, roundtrip = false): number {
  let base = 2500;
  let perKm = 27;

  if (jet.type === 'Very Light Jet') perKm = 22;
  else if (jet.type === 'Light Jet') perKm = 25;
  else if (jet.type === 'Super Light Jet') perKm = 30;
  else if (jet.type === 'Midsize Jet') perKm = 28;
  else if (jet.type === 'Super Midsize Jet') perKm = 32;
  else if (jet.type === 'Heavy Jet') perKm = 35;
  else if (jet.type === 'Ultra Long Range') perKm = 40;

  let total = base + distanceKm * perKm;
  total = Math.max(total, jet.min_booking_price || 5000);

  if (roundtrip) {
    total = total * 1.8;
  }

  return parseFloat(total.toFixed(0));
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 AI Jet Match gestartet');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('✅ Supabase Client erstellt');

    // ----------------------------------------------------
    // 1) Flughäfen aus der DB laden (vollständige Tabelle)
    // ----------------------------------------------------
    const { data: airports, error: airportsError } = await supabaseAdmin
      .from('airports')
      .select('iata, city, lat, lon');

    if (airportsError) {
      console.error('❌ Airports-DB-Error:', airportsError);
      throw new Error(`Airport-Daten konnten nicht geladen werden: ${airportsError.message}`);
    }

    if (!airports || airports.length === 0) {
      throw new Error('Keine Flughäfen in der Datenbank gefunden.');
    }

    console.log('✅ Flughäfen verfügbar:', airports.length);

    // ----------------------------------------------------
    // 2) Request einlesen
    // ----------------------------------------------------
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

    // ----------------------------------------------------
    // 3) Verfügbare Jets holen
    // ----------------------------------------------------
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

    // ----------------------------------------------------
    // 4) Route & Zeitpunkt
    // ----------------------------------------------------
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

    // ----------------------------------------------------
    // 5) Jets filtern & bewerten
    // ----------------------------------------------------
    const candidates = jetsData
      .map((jetRow: any) => {
        const jet: Jet = {
          ...jetRow,
          company_id: jetRow.company_jets[0]?.company_id,
          gallery_urls:
            typeof jetRow.gallery_urls === 'string'
              ? JSON.parse(jetRow.gallery_urls)
              : jetRow.gallery_urls,
          allow_empty_legs: jetRow.allow_empty_legs || false,
          empty_leg_discount: jetRow.empty_leg_discount || 50
        };

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
        const ferryFlightDurationHours = ferryDistanceKm / 800; // 800 km/h

        const totalLeadTimeHours = (jet.lead_time_hours || 4) + ferryFlightDurationHours;
        const hoursUntilFlight = (departureTime.getTime() - now.getTime()) / 3600000;

        const isSuitable =
          jet.seats >= passengers &&
          jet.range >= routeDistance &&
          hoursUntilFlight >= totalLeadTimeHours;

        if (!isSuitable) {
          console.log('[FILTER-OUT]', {
            jet: jet.name,
            seatsOk: jet.seats >= passengers,
            rangeOk: jet.range >= routeDistance,
            leadTimeOk: hoursUntilFlight >= totalLeadTimeHours,
            range: jet.range,
            routeDistance,
            hoursUntilFlight,
            totalLeadTimeHours
          });
          return null;
        }

        const totalDistance = ferryDistanceKm + routeDistance;
        const price = calculatePrice(totalDistance, jet, false);

        const emptyLegInfo = jet.allow_empty_legs
          ? {
              shouldCreateEmptyLeg: true,
              ferryRoute: {
                from_iata: jet.current_iata,
                from_lat: jet.current_lat,
                from_lng: jet.current_lng,
                to_iata: startAirport.iata,
                to_lat: startAirport.lat,
                to_lng: startAirport.lon
              },
              ferryDistanceKm: ferryDistanceKm,
              discount: jet.empty_leg_discount,
              normalPrice: calculatePrice(ferryDistanceKm, jet, false),
              discountedPrice: Math.round(
                calculatePrice(ferryDistanceKm, jet, false) * (1 - jet.empty_leg_discount / 100)
              )
            }
          : null;

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
      const hoursUntilFlight = (departureTime.getTime() - now.getTime()) / 3600000;
      throw new Error(
        `Kein passender Jet gefunden. Stunden bis Abflug: ${hoursUntilFlight.toFixed(
          1
        )}h. Bitte wählen Sie eine spätere Abflugzeit (mindestens 6–8 Stunden) oder passen Sie die Passagierzahl/Reichweite an.`
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

    console.error('❌ FEHLER in Edge Function:', errorMessage);
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

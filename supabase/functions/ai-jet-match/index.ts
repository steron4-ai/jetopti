// supabase/functions/ai-jet-match/index.ts
// ✅ ERWEITERT MIT EMPTY LEGS CREATION & ROBUSTEN KOORDINATEN- CHECKS

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
  current_iata: string;
  current_lat: number | null;
  current_lng: number | null;
  lead_time_hours: number | null;
  min_booking_price: number;
  home_base_iata: string | null;
  year_built: number | null;
  image_url: string | null;
  gallery_urls: string[] | null;
  company_id: string;
  allow_empty_legs: boolean;         // ✨ NEU
  empty_leg_discount: number;        // ✨ NEU
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
  const R = 6371;
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
  if (roundtrip) total = total * 1.8;

  return parseFloat(total.toFixed(0));
}

// ✨ Optional-Helfer: Airport von IATA finden
function findAirportByIATA(airports: Airport[], iata: string): Airport | null {
  return airports.find((a) => a.iata.toUpperCase() === iata.toUpperCase()) || null;
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

    // Lade airports.json aus Storage
    console.log('📥 Lade airports.json');
    const { data: airportBlob, error: airportError } = await supabaseAdmin.storage
      .from('jet-images')
      .download('public/airports.json');

    if (airportError || !airportBlob) {
      console.error('❌ Storage Error:', airportError);
      throw new Error(
        `Airport-Daten nicht gefunden: ${airportError?.message || 'Unbekannter Fehler beim Download'}`
      );
    }

    console.log('✅ airports.json heruntergeladen');
    const airports: Airport[] = JSON.parse(await airportBlob.text());
    console.log('✅ Flughäfen verfügbar:', airports.length);

    const body: RequestBody = await req.json();
    const { fromIATA, toIATA, passengers, dateTime } = body;

    console.log('📥 Anfrage:', { fromIATA, toIATA, passengers, dateTime });

    const startAirport =
      airports.find(
        (a: Airport) => a.iata.toUpperCase() === fromIATA.toUpperCase()
      ) || null;
    const destAirport =
      airports.find(
        (a: Airport) => a.iata.toUpperCase() === toIATA.toUpperCase()
      ) || null;

    console.log(
      '🛫 Start-Airport:',
      startAirport ? startAirport.iata : 'NICHT GEFUNDEN'
    );
    console.log(
      '🛬 Ziel-Airport:',
      destAirport ? destAirport.iata : 'NICHT GEFUNDEN'
    );

    if (!startAirport || !destAirport) {
      throw new Error(
        `Start- oder Zielflughafen nicht gefunden. Start: ${fromIATA}, Ziel: ${toIATA}`
      );
    }

    const { data: jetsData, error: jetsError } = await supabaseAdmin
      .from('jets')
      .select(
        `
        *,
        company_jets!inner(company_id)
      `
      )
      .eq('status', 'verfügbar');

    if (jetsError) {
      console.error('❌ Fehler beim Laden der Jets:', jetsError);
      throw jetsError;
    }

    if (!jetsData || jetsData.length === 0) {
      throw new Error('Keine verfügbaren Jets in der Datenbank gefunden.');
    }

    console.log('✅ Jets gefunden:', jetsData.length);

    const routeDistance = calculateDistance(
      startAirport.lat,
      startAirport.lon,
      destAirport.lat,
      destAirport.lon
    );
    const departureTime = new Date(dateTime);
    const now = new Date();

    const hoursUntilFlightGlobal =
      (departureTime.getTime() - now.getTime()) / 3600000;

    console.log('📊 Route-Distanz:', routeDistance.toFixed(0), 'km');
    console.log('⏰ Stunden bis Abflug:', hoursUntilFlightGlobal.toFixed(1), 'h');

    const candidates = (jetsData as any[])
      .map((jetRow: any) => {
        const jet: Jet = {
          ...jetRow,
          company_id: jetRow.company_jets?.[0]?.company_id,
          gallery_urls:
            typeof jetRow.gallery_urls === 'string'
              ? JSON.parse(jetRow.gallery_urls)
              : jetRow.gallery_urls,
          allow_empty_legs: jetRow.allow_empty_legs ?? false,
          empty_leg_discount: jetRow.empty_leg_discount ?? 50,
        };

        // 🔍 Koordinaten absichern
        const hasCoords =
          typeof jet.current_lat === 'number' &&
          !isNaN(jet.current_lat) &&
          typeof jet.current_lng === 'number' &&
          !isNaN(jet.current_lng);

        let ferryDistanceKm = 0;
        let ferryFlightDurationHours = 0;

        if (hasCoords) {
          ferryDistanceKm = calculateDistance(
            startAirport.lat,
            startAirport.lon,
            jet.current_lat as number,
            jet.current_lng as number
          );
          ferryFlightDurationHours = ferryDistanceKm / 800; // 800 km/h angenommen
        }

        const baseLeadTime =
          typeof jet.lead_time_hours === 'number' && !isNaN(jet.lead_time_hours)
            ? jet.lead_time_hours
            : 4; // Default 4h

        const totalLeadTimeHours = baseLeadTime + ferryFlightDurationHours;

        const hoursUntilFlight =
          (departureTime.getTime() - now.getTime()) / 3600000;

        const isSuitable =
          jet.seats >= passengers &&
          jet.range >= routeDistance &&
          hoursUntilFlight >= totalLeadTimeHours;

        console.log('🔎 Jet-Check:', {
          jet: jet.name,
          seats: jet.seats,
          requiredPassengers: passengers,
          range: jet.range,
          routeDistance,
          hasCoords,
          ferryDistanceKm: ferryDistanceKm.toFixed(0),
          baseLeadTime,
          ferryFlightDurationHours: ferryFlightDurationHours.toFixed(2),
          totalLeadTimeHours: totalLeadTimeHours.toFixed(2),
          hoursUntilFlight: hoursUntilFlight.toFixed(2),
          isSuitable,
        });

        if (!isSuitable) {
          return null;
        }

        const totalDistance = ferryDistanceKm + routeDistance;
        const price = calculatePrice(totalDistance, jet, false);

        // ✨ Empty Leg Info nur, wenn Koordinaten vorhanden sind
        const emptyLegInfo =
          jet.allow_empty_legs && hasCoords
            ? {
                shouldCreateEmptyLeg: true,
                ferryRoute: {
                  from_iata: jet.current_iata,
                  from_lat: jet.current_lat,
                  from_lng: jet.current_lng,
                  to_iata: startAirport.iata,
                  to_lat: startAirport.lat,
                  to_lng: startAirport.lon,
                },
                ferryDistanceKm,
                discount: jet.empty_leg_discount,
                normalPrice: calculatePrice(ferryDistanceKm, jet, false),
                discountedPrice: Math.round(
                  calculatePrice(ferryDistanceKm, jet, false) *
                    (1 - jet.empty_leg_discount / 100)
                ),
              }
            : null;

        return {
          jet,
          ferryDistanceKm,
          totalLeadTimeHours,
          price,
          emptyLegInfo,
        };
      })
      .filter(Boolean);

    console.log('✅ Geeignete Jets gefunden:', candidates.length);

    if (candidates.length === 0) {
      const hoursUntilFlight =
        (departureTime.getTime() - now.getTime()) / 3600000;
      throw new Error(
        `Kein passender Jet gefunden. Stunden bis Abflug: ${hoursUntilFlight.toFixed(
          1
        )}h. Bitte wählen Sie eine spätere Abflugzeit (mindestens 6–8 Stunden) oder passen Sie die Passagierzahl an.`
      );
    }

    // Günstigster Preis zuerst
    (candidates as any).sort(
      (a: any, b: any) => a!.price - b!.price
    );
    const bestMatch: any = (candidates as any)[0];

    console.log('✅ Bester Match gefunden:', bestMatch.jet.name);
    if (bestMatch.emptyLegInfo) {
      console.log('🔥 Empty Leg verfügbar:', bestMatch.emptyLegInfo);
    }

    const response = {
      ...bestMatch,
      fromIATA: startAirport.iata,
      toIATA: destAirport.iata,
      fromLocation: startAirport.city,
      toLocation: destAirport.city,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unbekannter Fehler';
    const errorStack = error instanceof Error ? error.stack : 'Kein Stack';

    console.error('❌ FEHLER in Edge Function:', errorMessage);
    console.error('📍 Stack:', errorStack);

    return new Response(
      JSON.stringify({
        error: errorMessage,
        type: (error as any)?.constructor?.name || 'Unknown',
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

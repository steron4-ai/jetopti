// supabase/functions/ai-jet-match/index.ts
// ✅ AI Jet Match V3 - Nutzt Unified Pricing Engine

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import {
  calculatePrice,
  calculateDistance,
  checkJetRange,
  getCruiseSpeed,
  type Jet,
  type Airport,
  type PriceContext,
} from '../_shared/pricing-engine.ts';

// ------------------------------------------------------------------
// TYPES
// ------------------------------------------------------------------
interface RequestBody {
  fromIATA: string;
  toIATA: string;
  passengers: number;
  dateTime: string;
}

interface JetRow {
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
  gallery_urls: string | string[] | null;
  allow_empty_legs: boolean;
  empty_leg_discount: number;
  price_per_hour: number | null;
  company_jets: { company_id: string }[];
}

// ------------------------------------------------------------------
// MAIN HANDLER
// ------------------------------------------------------------------
Deno.serve(async (req: Request) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 AI Jet Match V3 gestartet (Unified Pricing Engine)');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1) Flughäfen aus DB laden
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

    // Normalisieren
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
      (a) => a.iata.toUpperCase() === fromIATA.toUpperCase()
    );
    const destAirport = airports.find(
      (a) => a.iata.toUpperCase() === toIATA.toUpperCase()
    );

    if (!startAirport || !destAirport) {
      throw new Error(
        `Start- oder Zielflughafen nicht gefunden. Start: ${fromIATA}, Ziel: ${toIATA}`
      );
    }

    console.log('🛫 Start:', `${startAirport.city} (${startAirport.iata})`);
    console.log('🛬 Ziel:', `${destAirport.city} (${destAirport.iata})`);

    // 3) Verfügbare Jets laden
    const { data: jetsData, error: jetsError } = await supabaseAdmin
      .from('jets')
      .select(`
        *,
        company_jets!inner(company_id)
      `)
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
    const hoursUntilFlight = (departureTime.getTime() - now.getTime()) / 3600000;

    console.log('📊 Route-Distanz:', routeDistance.toFixed(0), 'km');
    console.log('⏰ Stunden bis Abflug:', hoursUntilFlight.toFixed(1), 'h');

    // 5) Jets filtern & bewerten
    const candidates = (jetsData as JetRow[])
      .map((jetRow) => {
        // Jet-Objekt normalisieren
        const jet: Jet = {
          ...jetRow,
          company_id: jetRow.company_jets[0]?.company_id,
          gallery_urls:
            typeof jetRow.gallery_urls === 'string'
              ? JSON.parse(jetRow.gallery_urls)
              : jetRow.gallery_urls,
          allow_empty_legs: jetRow.allow_empty_legs || false,
          empty_leg_discount: jetRow.empty_leg_discount || 50,
          price_per_hour: jetRow.price_per_hour ?? null,
        };

        // Ohne gültigen Stundenpreis → Skip
        if (!jet.price_per_hour || jet.price_per_hour <= 0) {
          console.log('[SKIP] Kein Stundenpreis:', jet.name);
          return null;
        }

        // Ohne Position → Skip
        if (
          jet.current_lat == null ||
          jet.current_lng == null ||
          Number.isNaN(jet.current_lat) ||
          Number.isNaN(jet.current_lng)
        ) {
          console.log('[SKIP] Keine Position:', jet.name);
          return null;
        }

        // Ferry-Distanz berechnen
        const ferryDistanceKm = calculateDistance(
          startAirport.lat,
          startAirport.lon,
          jet.current_lat!,
          jet.current_lng!
        );

        // Reichweiten-Check (Main + Ferry)
        const rangeCheck = checkJetRange(jet, routeDistance, ferryDistanceKm);
        if (!rangeCheck.valid) {
          console.log('[SKIP] Reichweite:', jet.name, rangeCheck.reason);
          return null;
        }

        // Lead-Time-Check
        const cruiseSpeed = getCruiseSpeed(jet);
        const ferryFlightHours = ferryDistanceKm / cruiseSpeed;
        const totalLeadTime = (jet.lead_time_hours || 4) + ferryFlightHours;

        if (hoursUntilFlight < totalLeadTime) {
          console.log('[SKIP] Lead-Time:', jet.name, {
            required: totalLeadTime.toFixed(1),
            available: hoursUntilFlight.toFixed(1),
          });
          return null;
        }

        // Sitze prüfen
        if (jet.seats < passengers) {
          console.log('[SKIP] Zu wenig Sitze:', jet.name, jet.seats, '<', passengers);
          return null;
        }

        // ✅ Preis berechnen mit Unified Pricing Engine
        const priceResult = calculatePrice({
          mainDistanceKm: routeDistance,
          ferryDistanceKm,
          jet,
          startAirport,
          destAirport,
          departureTime,
          now,
          passengers,
          isEmptyLeg: false,
          isRoundtrip: false,
          enforceMinPrice: true,
        });

        // Empty-Leg-Info berechnen (falls aktiviert)
        let emptyLegInfo: any = null;
        if (jet.allow_empty_legs && ferryDistanceKm > 50) {
          // Nur bei signifikanter Ferry-Distanz
          const jetLocationAirport = airports.find(
            (a) => a.iata.toUpperCase() === (jet.current_iata || '').toUpperCase()
          ) || {
            iata: jet.current_iata || 'UNK',
            lat: jet.current_lat!,
            lon: jet.current_lng!,
          };

          const emptyLegPrice = calculatePrice({
            mainDistanceKm: ferryDistanceKm,
            ferryDistanceKm: 0,
            jet,
            startAirport: jetLocationAirport,
            destAirport: startAirport,
            departureTime,
            now,
            passengers: 1,
            isEmptyLeg: true,
            isRoundtrip: false,
            enforceMinPrice: false, // Empty Legs dürfen unter Mindestpreis
          });

          const discount = jet.empty_leg_discount || 50;
          const discountedPrice = Math.round(
            emptyLegPrice.totalPrice * (1 - discount / 100)
          );

          emptyLegInfo = {
            shouldCreateEmptyLeg: true,
            ferryRoute: {
              from_iata: jet.current_iata,
              from_lat: jet.current_lat,
              from_lng: jet.current_lng,
              to_iata: startAirport.iata,
              to_lat: startAirport.lat,
              to_lng: startAirport.lon,
            },
            ferryDistanceKm: Math.round(ferryDistanceKm),
            discount,
            normalPrice: emptyLegPrice.totalPrice,
            discountedPrice,
          };
        }

        return {
          jet,
          ferryDistanceKm: Math.round(ferryDistanceKm),
          totalLeadTimeHours: Math.round(totalLeadTime * 10) / 10,
          price: priceResult.totalPrice,
          priceBreakdown: priceResult.breakdown,
          emptyLegInfo,
        };
      })
      .filter(Boolean) as any[];

    console.log('✅ Geeignete Jets:', candidates.length);

    if (candidates.length === 0) {
      throw new Error(
        `Kein passender Jet gefunden. Stunden bis Abflug: ${hoursUntilFlight.toFixed(1)}h. ` +
        `Bitte wählen Sie eine spätere Abflugzeit (mindestens 6–8 Stunden), ` +
        `passen Sie die Passagierzahl an oder wählen Sie eine andere Route.`
      );
    }

    // Nach Preis sortieren
    candidates.sort((a: any, b: any) => a.price - b.price);
    const bestMatch = candidates[0];

    console.log('✅ Bester Match:', bestMatch.jet.name, '€' + bestMatch.price);
    
    if (bestMatch.priceBreakdown.demand_reasons.length > 0) {
      console.log('📈 Demand-Faktoren:', bestMatch.priceBreakdown.demand_reasons.join(', '));
    }
    
    if (bestMatch.emptyLegInfo) {
      console.log('🔥 Empty Leg möglich:', bestMatch.emptyLegInfo.discountedPrice, '€');
    }

    // Response
    const response = {
      ...bestMatch,
      fromIATA: startAirport.iata,
      toIATA: destAirport.iata,
      fromLocation: startAirport.city,
      toLocation: destAirport.city,
      routeDistanceKm: Math.round(routeDistance),
      // Auch alle Kandidaten zurückgeben (Top 5)
      alternatives: candidates.slice(1, 6).map((c: any) => ({
        jetId: c.jet.id,
        jetName: c.jet.name,
        jetType: c.jet.type,
        price: c.price,
        seats: c.jet.seats,
      })),
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    console.error('❌ FEHLER:', errorMessage);

    return new Response(
      JSON.stringify({
        error: errorMessage,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
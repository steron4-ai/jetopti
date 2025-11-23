// supabase/functions/update-jet-positions/index.ts
// ✅ V14: Live-Position, Flugstatus, Auto-Airport & Auto-"Booking completed" bei Landung

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Function "update-jet-positions" V14 gestartet.');

// --------------------------------------------------------------------
// ENV / CONFIG
// --------------------------------------------------------------------
const SUPABASE_URL = Deno.env.get('PROJECT_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!;
const ADSB_API_KEY = Deno.env.get('ADSB_API_KEY')!;

const ADSB_API_HOST = 'adsbexchange-com1.p.rapidapi.com';
const ADSB_API_URL = 'https://adsbexchange-com1.p.rapidapi.com/v2/hex';

// Status-Werte wie in deiner DB
const STATUS_AVAILABLE = 'verfügbar';
const STATUS_IN_FLIGHT = 'in_flight';
const STATUS_BOOKED = 'gebucht';
const STATUS_MAINTENANCE = 'wartung';

// Booking-Status-Werte – ggf. an deine DB anpassen
const BOOKING_STATUS_ACCEPTED = 'accepted';
const BOOKING_STATUS_COMPLETED = 'completed';

// --------------------------------------------------------------------
// Helper
// --------------------------------------------------------------------
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

// einfache Distanz-Berechnung (Haversine in km)
function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

// --------------------------------------------------------------------
// MAIN
// --------------------------------------------------------------------
Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // 1. Jets laden
    const { data: jets, error: jetError } = await supabaseAdmin
      .from('jets')
      .select('id, name, icao24, status, current_iata, current_lat, current_lng')
      .not('icao24', 'is', null)
      .neq('icao24', '');

    if (jetError) {
      console.error('[ERROR] Konnte Jets nicht laden:', jetError);
      return json({ ok: false, error: 'jet_select_failed' }, 500);
    }

    if (!jets || jets.length === 0) {
      console.log('[INFO] Keine Jets mit ICAO24 gefunden.');
      return json({ ok: true, updated: 0, total: 0 });
    }

    console.log(`[START] Prüfe ${jets.length} Jets...`);

    // 2. Flughäfen einmalig laden (für Landeerkennung)
    const { data: airports, error: airportError } = await supabaseAdmin
      .from('airports')
      .select('iata, lat, lon');

    if (airportError) {
      console.error('[WARN] Konnte Airports nicht laden:', airportError);
    }

    let updatedJetsCount = 0;

    // 3. Loop über alle Jets
    for (const jet of jets as any[]) {
      const icao = (jet.icao24 || '').toLowerCase().trim();
      if (!icao) continue;

      try {
        const apiResponse = await fetch(`${ADSB_API_URL}/${icao}`, {
          headers: {
            'x-rapidapi-key': ADSB_API_KEY,
            'x-rapidapi-host': ADSB_API_HOST,
          },
        });

        console.log(`[ADSB] Status für ${icao}: ${apiResponse.status}`);

        if (!apiResponse.ok) {
          const txt = await apiResponse.text();
          console.warn(
            `[WARN] ADSBexchange HTTP-Fehler für ${icao}: ${apiResponse.status} ${txt.slice(
              0,
              120,
            )}`,
          );
          continue;
        }

        const data = await apiResponse.json() as any;

        // ADSBexchange V2 liefert ein einzelnes Objekt
        const lat = toNumber(data.lat, NaN);
        const lng = toNumber(data.lon, NaN);
        const groundSpeed = toNumber(data.gs, 0);       // Knoten
        const altitude = toNumber(data.alt_baro, 0);    // Fuß

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          console.log(`[INFO] Keine Positionsdaten für ${icao}.`);
          continue;
        }

        // ----------------------------------------------------
        // Flug-/Lande-Logik
        // ----------------------------------------------------
        const wasStatus: string = jet.status || STATUS_AVAILABLE;
        let newStatus: string = wasStatus;
        let newIata: string | null = jet.current_iata || null;
        let hasLandedNow = false;

        // Heuristik: Jet fliegt, wenn Speed > 50 kts und Höhe > 500 ft
        const isAirborne = groundSpeed > 50 && altitude > 500;

        if (isAirborne) {
          // Nur auf "in_flight" setzen, wenn er vorher am Boden war
          if (wasStatus === STATUS_AVAILABLE) {
            newStatus = STATUS_IN_FLIGHT;
          }
        } else {
          // Jet ist am Boden / sehr langsam
          if (wasStatus === STATUS_IN_FLIGHT) {
            hasLandedNow = true;
          }

          // Wenn er nicht explizit "gebucht" oder "wartung" ist, zurück auf "verfügbar"
          if (wasStatus !== STATUS_BOOKED && wasStatus !== STATUS_MAINTENANCE) {
            newStatus = STATUS_AVAILABLE;
          }
        }

        // ----------------------------------------------------
        // Airport-Autodetektion bei Landung
        // ----------------------------------------------------
        if (hasLandedNow && airports && airports.length > 0) {
          let bestAirport: any = null;
          let bestDist = 40; // km Radius

          for (const ap of airports) {
            const d = distanceKm(lat, lng, ap.lat, ap.lon);
            if (d < bestDist) {
              bestDist = d;
              bestAirport = ap;
            }
          }

          if (bestAirport && bestAirport.iata !== jet.current_iata) {
            console.log(
              `[LANDUNG] Jet ${icao} in Nähe von ${bestAirport.iata} (≈ ${bestDist.toFixed(
                1,
              )} km)`,
            );
            newIata = bestAirport.iata;
          }
        }

        // ----------------------------------------------------
        // DB-Update für Jet
        // ----------------------------------------------------
        const updatePayload: Record<string, any> = {
          current_lat: lat,
          current_lng: lng,
          last_pos_updated_at: new Date().toISOString(),
        };

        if (newIata !== jet.current_iata) {
          updatePayload.current_iata = newIata;
        }
        if (newStatus !== wasStatus) {
          updatePayload.status = newStatus;
        }

        const { error: updateError } = await supabaseAdmin
          .from('jets')
          .update(updatePayload)
          .eq('id', jet.id);

        if (updateError) {
          console.error(
            `[ERROR] DB-Update für Jet ${jet.name ?? jet.id} (${icao}) fehlgeschlagen:`,
            updateError,
          );
          continue;
        }

        updatedJetsCount++;
        console.log(
          `[UPDATE] Jet ${jet.name ?? jet.id} (${icao}) -> Pos: ${lat}, ${lng}, Status: ${wasStatus} -> ${newStatus}, IATA: ${jet.current_iata} -> ${newIata}`,
        );

        // ----------------------------------------------------
        // NEU: Buchungen automatisch abschließen, wenn Jet gelandet ist
        // ----------------------------------------------------
        if (hasLandedNow) {
          const { error: bookingError } = await supabaseAdmin
            .from('bookings')
            .update({ status: BOOKING_STATUS_COMPLETED })
            .eq('jet_id', jet.id)
            .eq('status', BOOKING_STATUS_ACCEPTED);

          if (bookingError) {
            console.error(
              `[WARN] Konnte Buchungen für Jet ${jet.name ?? jet.id} nicht auf "${BOOKING_STATUS_COMPLETED}" setzen:`,
              bookingError,
            );
          } else {
            console.log(
              `[BOOKINGS] Alle "${BOOKING_STATUS_ACCEPTED}"-Buchungen für Jet ${jet.name ?? jet.id} als "${BOOKING_STATUS_COMPLETED}" markiert.`,
            );
          }
        }
      } catch (fetchErr) {
        console.error(
          `[ERROR] ADSBexchange-Fetch für ${icao} fehlgeschlagen:`,
          fetchErr,
        );
      }
    }

    console.log(`[DONE] ${updatedJetsCount} Jet(s) aktualisiert.`);
    return json({ ok: true, updated: updatedJetsCount, total: jets.length });
  } catch (err) {
    console.error('Schwerwiegender Fehler in update-jet-positions:', err);
    return json({ ok: false, error: 'fatal' }, 500);
  }
});

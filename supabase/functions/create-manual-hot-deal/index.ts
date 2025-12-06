// supabase/functions/create-manual-hot-deal/index.ts
// ✅ PERFEKT ANGEPASST an vorhandene Tabellen-Struktur
// Verwendet: discount (nicht discount_percent), company_id (nicht owner_id)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log('create-manual-hot-deal function started');

interface CreateManualHotDealRequest {
  jet_id: string;
  reason: string;
  from_iata: string;
  to_iata: string;
  departure_date: string;
  discount: number;
  available_until_hours: number;
  notes?: string;
  external_booking_reference?: string;
}

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // ========================
    // 1. AUTH CHECK
    // ========================
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Nicht authentifiziert');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
    });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Auth Error:', userError);
      throw new Error('Nicht authentifiziert');
    }

    console.log('✅ User authenticated:', user.id);

    // ========================
    // 2. REQUEST BODY
    // ========================
    const body = (await req.json()) as CreateManualHotDealRequest;
    console.log('📦 Manual Hot Deal Request:', body);

    // Validierungen
    if (!body.jet_id) throw new Error('Jet ID fehlt');
    if (!body.from_iata) throw new Error('Start-Flughafen fehlt');
    if (!body.to_iata) throw new Error('Ziel-Flughafen fehlt');
    if (body.from_iata === body.to_iata) throw new Error('Start und Ziel müssen unterschiedlich sein');
    if (!body.departure_date) throw new Error('Abflugdatum fehlt');
    if (typeof body.discount !== 'number' || body.discount < 0 || body.discount > 100) {
      throw new Error('Rabatt muss zwischen 0 und 100 sein');
    }

    // ========================
    // 3. JET LADEN
    // ========================
    const { data: jet, error: jetError } = await supabaseAdmin
      .from('jets')
      .select('*')
      .eq('id', body.jet_id)
      .single();

    if (jetError || !jet) {
      console.error('❌ Jet Load Error:', jetError);
      throw new Error(`Jet konnte nicht geladen werden: ${jetError?.message || 'Unbekannter Fehler'}`);
    }

    console.log('✅ Jet geladen:', jet.name);

    // Check allow_empty_legs
    if (!jet.allow_empty_legs) {
      throw new Error('Dieser Jet ist nicht für Hot Deals freigegeben.');
    }

    // ========================
    // 4. AIRPORTS LADEN
    // ========================
    const { data: airports, error: airportError } = await supabaseAdmin
      .from('airports')
      .select('iata, lat, lon, city')
      .in('iata', [body.from_iata, body.to_iata]);

    if (airportError || !airports || airports.length !== 2) {
      console.error('❌ Airport Error:', airportError);
      throw new Error(`Flughäfen ${body.from_iata} oder ${body.to_iata} nicht gefunden`);
    }

    const fromAirport = airports.find((a) => a.iata === body.from_iata);
    const toAirport = airports.find((a) => a.iata === body.to_iata);

    if (!fromAirport || !toAirport) {
      throw new Error('Flughäfen konnten nicht zugeordnet werden');
    }

    console.log('✅ Airports geladen:', fromAirport.city, '→', toAirport.city);

    // ========================
    // 5. DISTANZ BERECHNEN
    // ========================
    const R = 6371; // km
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(toAirport.lat - fromAirport.lat);
    const dLon = toRad(toAirport.lon - fromAirport.lon);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(fromAirport.lat)) *
        Math.cos(toRad(toAirport.lat)) *
        Math.sin(dLon / 2) ** 2;
    const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    console.log('📏 Distanz:', distance.toFixed(0), 'km');

    // ========================
    // 6. NORMALPREIS BERECHNEN
    // ========================
    const pricePerHour = jet.price_per_hour || 5000; // Fallback
    const avgSpeedKmH = 700; // Durchschnitt Light Jet
    const hours = distance / avgSpeedKmH;
    const normalPrice = hours * pricePerHour;
    const discountedPrice = normalPrice * (1 - body.discount / 100);

    console.log('💰 Normal:', normalPrice.toFixed(2), '€, Rabatt:', discountedPrice.toFixed(2), '€');

    // ========================
    // 7. AVAILABLE UNTIL
    // ========================
    const departureDate = new Date(body.departure_date);
    const availableUntil = new Date(
      departureDate.getTime() - body.available_until_hours * 60 * 60 * 1000,
    );

    console.log('⏰ Buchbar bis:', availableUntil.toISOString());

    // ========================
    // 8. EMPTY LEG ERSTELLEN
    // ========================
    // ⚠️ WICHTIG: Verwendet die TATSÄCHLICHEN Spaltennamen!
    const { data: emptyLeg, error: insertError } = await supabaseAdmin
      .from('empty_legs')
      .insert({
        jet_id: body.jet_id,
        from_iata: body.from_iata,
        from_lat: fromAirport.lat,
        from_lng: fromAirport.lon,
        to_iata: body.to_iata,
        to_lat: toAirport.lat,
        to_lng: toAirport.lon,
        normal_price: normalPrice,
        discounted_price: discountedPrice,
        discount: body.discount, // ✅ heißt nur "discount", nicht "discount_percent"!
        available_until: availableUntil.toISOString(),
        reason: body.reason,
        is_active: true,
        company_id: user.id, // ✅ heißt "company_id", nicht "owner_id"!
        source: 'manual',
        created_by: user.id,
        notes: body.notes || null,
        external_booking_reference: body.external_booking_reference || null,
      })
      .select()
      .single();

    if (insertError || !emptyLeg) {
      console.error('❌ Insert Error:', insertError);
      throw new Error(`Hot Deal konnte nicht erstellt werden: ${insertError?.message || 'Unbekannter Fehler'}`);
    }

    console.log('✅ Hot Deal erstellt:', emptyLeg.id);

    // ========================
    // 9. OPTIONAL: JET POSITION UPDATEN
    // ========================
    if (body.reason === 'repositioning') {
      const { error: updateError } = await supabaseAdmin
        .from('jets')
        .update({ current_iata: body.to_iata })
        .eq('id', body.jet_id);

      if (updateError) {
        console.warn('⚠️ Jet Position Update fehlgeschlagen:', updateError);
      } else {
        console.log('✅ Jet Position aktualisiert:', body.to_iata);
      }
    }

    // ========================
    // 10. SUCCESS
    // ========================
    return new Response(
      JSON.stringify({
        ok: true,
        hot_deal: {
          id: emptyLeg.id,
          from: fromAirport.city,
          to: toAirport.city,
          normal_price: normalPrice,
          discounted_price: discountedPrice,
          discount: body.discount,
        },
        message: '🔥 Hot Deal erfolgreich erstellt!',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  } catch (error: any) {
    console.error('❌ Manual Hot Deal Error:', error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: error?.message || 'Interner Fehler',
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  }
});

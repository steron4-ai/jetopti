// supabase/functions/create-empty-leg/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 🔧 CORS-Header
const corsHeaders: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

serve(async (req) => {
  // 🛟 CORS-Preflight beantworten
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const { bookingId } = await req.json();
    if (!bookingId) {
      return new Response(
        JSON.stringify({ error: "bookingId missing" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // 1. Buchung laden
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      console.log("❌ Booking nicht gefunden:", bookingError);
      return new Response(
        JSON.stringify({
          created: false,
          reason: "Buchung nicht gefunden",
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (booking.status !== "accepted") {
      return new Response(
        JSON.stringify({
          created: false,
          reason: `Buchung hat Status ${booking.status}, kein Empty Leg`,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // 2. Jet laden
    const { data: jet, error: jetError } = await supabase
      .from("jets")
      .select("*")
      .eq("id", booking.jet_id)
      .single();

    if (jetError || !jet) {
      console.log("❌ Jet nicht gefunden:", jetError);
      return new Response(
        JSON.stringify({
          created: false,
          reason: "Jet nicht gefunden",
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (!jet.allow_empty_legs) {
      return new Response(
        JSON.stringify({
          created: false,
          reason: "Jet bietet keine Empty Legs an",
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // 3. Start / Jet-Standort bestimmen
    const fromCode = (booking.from_iata || booking.from_location || "")
      .toUpperCase();
    const jetCode = (jet.current_iata || "").toUpperCase();

    if (!fromCode || !jetCode) {
      return new Response(
        JSON.stringify({
          created: false,
          reason: "Fehlender IATA-Code (from_iata oder current_iata)",
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const { data: airports, error: airportsError } = await supabase
      .from("airports")
      .select("*")
      .in("iata", [fromCode, jetCode]);

    if (airportsError || !airports || airports.length === 0) {
      console.log("❌ Airports nicht gefunden:", airportsError);
      return new Response(
        JSON.stringify({
          created: false,
          reason: "Flughäfen nicht gefunden",
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const startAirport = airports.find(
      (a: any) => (a.iata || "").toUpperCase() === fromCode,
    );
    const jetAirport = airports.find(
      (a: any) => (a.iata || "").toUpperCase() === jetCode,
    );

    if (!startAirport || !jetAirport) {
      return new Response(
        JSON.stringify({
          created: false,
          reason: "Start- oder Jet-Flughafen fehlt",
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (startAirport.iata === jetAirport.iata) {
      return new Response(
        JSON.stringify({
          created: false,
          reason: "Jet steht bereits am Startflughafen",
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // 4. Distanz & Preis
    const distanceKm = haversineKm(
      Number(jetAirport.lat),
      Number(jetAirport.lon),
      Number(startAirport.lat),
      Number(startAirport.lon),
    );

    const hourlyRate = Number(jet.price_per_hour) || 4500;
    const minPrice = Number(jet.min_booking_price) || 5000;

    const cruiseSpeed = 800; // km/h
    const blockHours = Math.max(distanceKm / cruiseSpeed + 0.4, 0.8);
    const normalPriceRaw = blockHours * hourlyRate;
    const normalPrice = Math.round(Math.max(normalPriceRaw, minPrice));

    const discount = jet.empty_leg_discount || 50;
    const discountedPrice = Math.round(normalPrice * (1 - discount / 100));

    // 5. Verfügbarkeit
    const departureTime = new Date(booking.departure_date);
    const leadTimeHours = jet.lead_time_hours || 4;

    if (isNaN(departureTime.getTime())) {
      return new Response(
        JSON.stringify({
          created: false,
          reason: "Ungültiges departure_date in Buchung",
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const leadTimeMs = leadTimeHours * 60 * 60 * 1000;
    const emptyLegDurationMs = blockHours * 60 * 60 * 1000;
    const safetyBufferMs = 2 * 60 * 60 * 1000;

    const availableUntil = new Date(
      departureTime.getTime()
        - leadTimeMs
        - emptyLegDurationMs
        - safetyBufferMs,
    );

    if (availableUntil.getTime() < Date.now()) {
      return new Response(
        JSON.stringify({
          created: false,
          reason: "Zeitfenster für Hot Deal bereits abgelaufen",
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // 6. Empty Leg anlegen
    const { data: emptyLeg, error: emptyLegError } = await supabase
      .from("empty_legs")
      .insert({
        jet_id: jet.id,
        company_id: booking.company_id,
        from_iata: jetAirport.iata,
        from_lat: jetAirport.lat,
        from_lng: jetAirport.lon,
        to_iata: startAirport.iata,
        to_lat: startAirport.lat,
        to_lng: startAirport.lon,
        normal_price: normalPrice,
        discounted_price: discountedPrice,
        discount,
        available_until: availableUntil.toISOString(),
        is_active: true,
        reason: "Repositioning flight",
      })
      .select()
      .single();

    if (emptyLegError || !emptyLeg) {
      console.log("❌ Fehler beim Erstellen des Empty Legs:", emptyLegError);
      return new Response(
        JSON.stringify({
          created: false,
          reason: "Fehler beim Erstellen des Empty Legs",
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    console.log("✅ Empty Leg erstellt:", emptyLeg.id);

    return new Response(
      JSON.stringify({
        created: true,
        empty_leg: emptyLeg,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (err) {
    console.error("❌ Unerwarteter Fehler in create-empty-leg:", err);
    return new Response(
      JSON.stringify({
        created: false,
        error: "Unexpected error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});

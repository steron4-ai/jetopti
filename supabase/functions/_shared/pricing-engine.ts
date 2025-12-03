// supabase/functions/_shared/pricing-engine.ts
// ✅ JetOpti Unified Pricing Engine V3 - "Coca-Cola-Rezept"
// Single Source of Truth für alle Preisberechnungen

// ------------------------------------------------------------------
// TYPES
// ------------------------------------------------------------------
export interface Jet {
  id: string;
  name: string;
  type: string;
  seats: number;
  range: number;
  status?: string;
  current_iata: string | null;
  current_lat?: number | null;
  current_lng?: number | null;
  lead_time_hours: number | null;
  min_booking_price: number | null;
  home_base_iata?: string | null;
  year_built?: number | null;
  image_url?: string | null;
  gallery_urls?: string[] | null;
  company_id?: string;
  allow_empty_legs?: boolean;
  empty_leg_discount?: number;
  price_per_hour: number | null;
}

export interface Airport {
  iata: string;
  city?: string;
  lat: number;
  lon: number;
}

export interface PriceContext {
  mainDistanceKm: number;
  ferryDistanceKm?: number;
  jet: Jet;
  startAirport: Airport;
  destAirport: Airport;
  departureTime: Date;
  now: Date;
  passengers?: number;
  isEmptyLeg?: boolean;
  isRoundtrip?: boolean;
  enforceMinPrice?: boolean;
}

export interface PriceBreakdown {
  block_main_h: number;
  block_ferry_h: number;
  block_total_h: number;
  hourly_rate: number;
  flight_cost: number;
  crew_cost: number;
  landing_fees: number;
  fuel_surcharge: number;
  passenger_fees: number;
  demand_factor: number;
  demand_reasons: string[];
  min_price_applied: boolean;
  final_price: number;
}

export interface PriceResult {
  totalPrice: number;
  breakdown: PriceBreakdown;
}

// ------------------------------------------------------------------
// CONSTANTS
// ------------------------------------------------------------------

// Premium-Airports: Höhere Landing Fees & Demand
export const PREMIUM_AIRPORTS_TIER1 = new Set([
  'LHR', 'JFK', 'LAX', 'DXB', 'HKG', 'SIN', // Mega-Hubs
]);

export const PREMIUM_AIRPORTS_TIER2 = new Set([
  'LGW', 'LCY', 'CDG', 'ORY', 'LBG',        // London & Paris
  'FRA', 'MUC', 'ZRH', 'GVA', 'VIE',        // DACH
  'EWR', 'LGA', 'SFO', 'MIA', 'LAS', 'VNY', // USA
  'DOH', 'JED', 'RUH', 'NRT',               // Middle East & Asia
  'NCE', 'IBZ', 'OLB', 'PMI', 'MYK', 'SKG', // Sommer/Luxury
  'INN', 'SZG', 'GVA', 'SIR',               // Ski-Resorts
]);

// Ski-Resort Airports für Winter-Pricing
const SKI_AIRPORTS = new Set(['GVA', 'ZRH', 'INN', 'SZG', 'SIR', 'CMF', 'LYS']);

// Party/Summer Airports
const SUMMER_HOTSPOTS = new Set(['IBZ', 'OLB', 'PMI', 'MYK', 'JTR', 'CFU', 'SPU']);

// ------------------------------------------------------------------
// HELPER FUNCTIONS
// ------------------------------------------------------------------

/**
 * Haversine-Distanz in km
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Erdradius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Cruise-Speed nach Jet-Klasse (km/h) - EINHEITLICH
 */
export function getCruiseSpeed(jet: Jet): number {
  const t = (jet.type || '').toLowerCase();
  
  if (t.includes('very light')) return 620;
  if (t.includes('super light')) return 740;
  if (t.includes('light') && !t.includes('super')) return 700;
  if (t.includes('super midsize')) return 830;
  if (t.includes('midsize') && !t.includes('super')) return 780;
  if (t.includes('heavy')) return 860;
  if (t.includes('ultra long')) return 900;
  if (t.includes('bbj') || t.includes('lineage') || t.includes('acj')) return 880;
  
  return 780; // Default Midsize
}

/**
 * Mindest-Blockzeit je Segment (Industrie-Standard)
 */
export function getMinBlockHours(jet: Jet): number {
  const t = (jet.type || '').toLowerCase();
  
  if (t.includes('very light')) return 1.0;
  if (t.includes('light')) return 1.5;
  if (t.includes('super midsize')) return 2.0;
  if (t.includes('midsize')) return 2.0;
  if (t.includes('heavy')) return 2.5;
  if (t.includes('ultra long')) return 3.0;
  
  return 1.5;
}

/**
 * Fallback Hourly Rate falls price_per_hour nicht gesetzt
 */
export function getFallbackHourlyRate(jet: Jet): number {
  const t = (jet.type || '').toLowerCase();
  
  if (t.includes('very light')) return 2500;
  if (t.includes('super light')) return 4000;
  if (t.includes('light') && !t.includes('super')) return 3500;
  if (t.includes('super midsize')) return 5500;
  if (t.includes('midsize') && !t.includes('super')) return 4500;
  if (t.includes('heavy')) return 7000;
  if (t.includes('ultra long')) return 9000;
  
  return 4000;
}

/**
 * Blockzeit berechnen (inkl. Taxi, Climb, Approach)
 */
function calculateBlockHours(
  distanceKm: number,
  cruiseSpeed: number,
  minBlock: number
): number {
  if (distanceKm <= 0) return 0;
  
  const pureFlightTime = distanceKm / cruiseSpeed;
  // +0.4h für Taxi, Climb, Approach
  const totalTime = pureFlightTime + 0.4;
  
  return Math.max(totalTime, minBlock);
}

/**
 * Crew-Kosten berechnen - EINHEITLICH
 * Basis: 2 Piloten, bei Heavy/Ultra 3 Piloten
 * Rate: ~200€/h pro Pilot
 */
function calculateCrewCost(blockHours: number, jet: Jet): number {
  const t = (jet.type || '').toLowerCase();
  
  let crewCount = 2;
  if (t.includes('heavy') || t.includes('ultra long')) {
    crewCount = 3; // Langstrecke: Augmentation Crew
  }
  
  const ratePerPilotPerHour = 200;
  return Math.ceil(blockHours) * crewCount * ratePerPilotPerHour;
}

/**
 * Landing Fees nach Airport-Tier - EINHEITLICH
 */
function getLandingFee(iata: string): number {
  const code = (iata || '').toUpperCase();
  
  if (PREMIUM_AIRPORTS_TIER1.has(code)) return 1500;
  if (PREMIUM_AIRPORTS_TIER2.has(code)) return 800;
  
  return 350; // Standard-Airports
}

function calculateLandingFees(
  startAirport: Airport,
  destAirport: Airport,
  isRoundtrip: boolean
): number {
  const startFee = getLandingFee(startAirport.iata);
  const destFee = getLandingFee(destAirport.iata);
  
  const oneWay = startFee + destFee;
  return isRoundtrip ? oneWay * 2 : oneWay;
}

/**
 * ✨ NEU: Fuel Surcharge bei Langstrecken
 */
function calculateFuelSurcharge(mainDistanceKm: number, jet: Jet): number {
  if (mainDistanceKm <= 2000) return 0;
  
  const t = (jet.type || '').toLowerCase();
  let fuelRatePerKm = 0.6; // Standard €/km
  
  // Größere Jets verbrauchen mehr
  if (t.includes('heavy') || t.includes('ultra long')) {
    fuelRatePerKm = 1.0;
  } else if (t.includes('super midsize')) {
    fuelRatePerKm = 0.8;
  }
  
  // Nur für Distanz über 2000km
  const extraDistance = mainDistanceKm - 2000;
  return Math.round(extraDistance * fuelRatePerKm);
}

/**
 * Passagier-Zusatzgebühr (ab 5. Pax)
 */
function calculatePassengerFees(passengers: number): number {
  const pax = Math.max(1, passengers || 1);
  return pax > 4 ? (pax - 4) * 150 : 0;
}

/**
 * ✨ NEU: Demand-Faktor mit Seasonal Pricing & Night Operations
 */
function calculateDemandFactor(
  ctx: PriceContext
): { factor: number; reasons: string[] } {
  const {
    mainDistanceKm,
    startAirport,
    destAirport,
    departureTime,
    now,
    isEmptyLeg = false,
  } = ctx;

  let factor = 1.0;
  const reasons: string[] = [];

  const startCode = (startAirport.iata || '').toUpperCase();
  const destCode = (destAirport.iata || '').toUpperCase();

  const hoursUntilFlight = (departureTime.getTime() - now.getTime()) / 3600000;
  const dayOfWeek = departureTime.getUTCDay(); // 0 = So, 6 = Sa
  const month = departureTime.getUTCMonth() + 1; // 1-12
  const hour = departureTime.getUTCHours();

  // Empty Legs bekommen weniger Aufschläge (sollen attraktiv bleiben)
  if (!isEmptyLeg) {
    // Weekend (Fr, Sa, So)
    if (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0) {
      factor += 0.10;
      reasons.push('Weekend');
    }

    // Last-Minute (< 24h)
    if (hoursUntilFlight < 24) {
      factor += 0.12;
      reasons.push('Last-Minute');
    } else if (hoursUntilFlight < 48) {
      factor += 0.06;
      reasons.push('Kurzfristig');
    }

  }

  // ✨ NEU: Seasonal Pricing
  
  // Sommer allgemein (Juni-August)
  const isSummer = month >= 6 && month <= 8;
  if (isSummer) {
    factor += 0.05;
    reasons.push('Sommersaison');
  }

  // Ibiza/Party-Saison (Mai-September)
  const isPartySeason = month >= 5 && month <= 9;
  if (isPartySeason && (SUMMER_HOTSPOTS.has(startCode) || SUMMER_HOTSPOTS.has(destCode))) {
    factor += 0.15;
    reasons.push('Party-Destination');
  }

  // Ski-Saison (Dezember-Februar)
  const isSkiSeason = month === 12 || month === 1 || month === 2;
  if (isSkiSeason && (SKI_AIRPORTS.has(startCode) || SKI_AIRPORTS.has(destCode))) {
    factor += 0.12;
    reasons.push('Ski-Saison');
  }

  // Weihnachten/Neujahr (15. Dez - 5. Jan)
  const day = departureTime.getUTCDate();
  const isXmas = (month === 12 && day >= 15) || (month === 1 && day <= 5);
  if (isXmas) {
    factor += 0.12;
    reasons.push('Weihnachten/Neujahr');
  }

  // Ostern (grob: letzte März-Woche / erste April-Wochen)
  const isEaster = (month === 3 && day >= 25) || (month === 4 && day <= 20);
  if (isEaster) {
    factor += 0.08;
    reasons.push('Osterferien');
  }

  // Premium-Route (Tier 1 oder Tier 2 Airport)
  if (PREMIUM_AIRPORTS_TIER1.has(startCode) || PREMIUM_AIRPORTS_TIER1.has(destCode)) {
    factor += 0.15;
    reasons.push('Premium-Hub');
  } else if (PREMIUM_AIRPORTS_TIER2.has(startCode) || PREMIUM_AIRPORTS_TIER2.has(destCode)) {
    factor += 0.08;
    reasons.push('Premium-Airport');
  }

  // Langstrecke (> 6000km)
  if (mainDistanceKm > 6000) {
    factor += 0.10;
    reasons.push('Langstrecke');
  }

  return { factor, reasons };
}

// ------------------------------------------------------------------
// MAIN PRICING FUNCTION
// ------------------------------------------------------------------

/**
 * JetOpti Unified Pricing Engine V3
 * 
 * Berechnet den Preis basierend auf:
 * - Blockzeit (Haupt + Ferry) × Stundenpreis
 * - Crew-Kosten
 * - Landing Fees (nach Airport-Tier)
 * - Fuel Surcharge (bei Langstrecken)
 * - Passagier-Gebühren (ab 5. Pax)
 * - Demand-Faktoren (Seasonal, Weekend, Last-Minute, Night, Premium)
 * - Mindestpreis (optional)
 */
export function calculatePrice(ctx: PriceContext): PriceResult {
  const {
    mainDistanceKm,
    ferryDistanceKm = 0,
    jet,
    startAirport,
    destAirport,
    departureTime,
    now,
    passengers = 1,
    isEmptyLeg = false,
    isRoundtrip = false,
    enforceMinPrice = true,
  } = ctx;

  // Basis-Parameter
  const cruiseSpeed = getCruiseSpeed(jet);
  const hourlyRate = jet.price_per_hour || getFallbackHourlyRate(jet);
  const minBlock = getMinBlockHours(jet);

  // Ungültiger Jet (kein Stundenpreis und kein Fallback möglich)
  if (hourlyRate <= 0) {
    return {
      totalPrice: Number.POSITIVE_INFINITY,
      breakdown: {
        block_main_h: 0,
        block_ferry_h: 0,
        block_total_h: 0,
        hourly_rate: 0,
        flight_cost: 0,
        crew_cost: 0,
        landing_fees: 0,
        fuel_surcharge: 0,
        passenger_fees: 0,
        demand_factor: 1,
        demand_reasons: ['Ungültiger Jet'],
        min_price_applied: false,
        final_price: Number.POSITIVE_INFINITY,
      },
    };
  }

  // Blockzeiten berechnen
  let blockMain = calculateBlockHours(mainDistanceKm, cruiseSpeed, minBlock);
  let blockFerry = ferryDistanceKm > 0 
    ? calculateBlockHours(ferryDistanceKm, cruiseSpeed, 0.7) 
    : 0;
  
  let blockTotal = blockMain + blockFerry;

  // Roundtrip: ×1.8 (nicht ×2.0, da Rückflug effizienter)
  if (isRoundtrip) {
    blockTotal *= 1.8;
    blockMain *= 1.8;
  }

  // Kosten berechnen
  const flightCost = blockTotal * hourlyRate;
  const crewCost = calculateCrewCost(blockTotal, jet);
  const landingFees = calculateLandingFees(startAirport, destAirport, isRoundtrip);
  const fuelSurcharge = calculateFuelSurcharge(mainDistanceKm * (isRoundtrip ? 2 : 1), jet);
  const passengerFees = calculatePassengerFees(passengers);

  // Demand-Faktor
  const { factor: demandFactor, reasons: demandReasons } = calculateDemandFactor(ctx);

  // Summe
  let total = flightCost + crewCost + landingFees + fuelSurcharge + passengerFees;
  total *= demandFactor;

  // Mindestpreis (nicht für Empty Legs)
  let minPriceApplied = false;
  if (enforceMinPrice && !isEmptyLeg) {
    const minPrice = jet.min_booking_price || 5000;
    if (total < minPrice) {
      total = minPrice;
      minPriceApplied = true;
    }
  }

  // Runden auf ganze Euro
  const finalPrice = Math.round(total);

  return {
    totalPrice: finalPrice,
    breakdown: {
      block_main_h: Math.round(blockMain * 100) / 100,
      block_ferry_h: Math.round(blockFerry * 100) / 100,
      block_total_h: Math.round(blockTotal * 100) / 100,
      hourly_rate: hourlyRate,
      flight_cost: Math.round(flightCost),
      crew_cost: Math.round(crewCost),
      landing_fees: landingFees,
      fuel_surcharge: fuelSurcharge,
      passenger_fees: passengerFees,
      demand_factor: Math.round(demandFactor * 100) / 100,
      demand_reasons: demandReasons,
      min_price_applied: minPriceApplied,
      final_price: finalPrice,
    },
  };
}

/**
 * Reichweiten-Check für Jet-Matching
 */
export function checkJetRange(
  jet: Jet,
  mainDistanceKm: number,
  ferryDistanceKm: number
): { valid: boolean; reason?: string } {
  // 1) Hauptstrecke muss in Reichweite sein
  if (mainDistanceKm > jet.range) {
    return {
      valid: false,
      reason: `Hauptstrecke (${mainDistanceKm.toFixed(0)}km) > Reichweite (${jet.range}km)`,
    };
  }

  // 2) Anflug max. 60% der Reichweite
  if (ferryDistanceKm > jet.range * 0.6) {
    return {
      valid: false,
      reason: `Anflug (${ferryDistanceKm.toFixed(0)}km) > 60% der Reichweite`,
    };
  }

  // 3) Gesamt max. 85% der Reichweite
  if (mainDistanceKm + ferryDistanceKm > jet.range * 0.85) {
    return {
      valid: false,
      reason: `Gesamt (${(mainDistanceKm + ferryDistanceKm).toFixed(0)}km) > 85% der Reichweite`,
    };
  }

  return { valid: true };
}
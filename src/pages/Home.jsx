// src/pages/Home.jsx
// ✅ PHASE 1 (ANFRAGE-MODELL) - Payment entfernt, Jet-Reservierung + AI Jet Match + Hot Deals

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom"; // Für Phase 2 behalten
import mapboxgl from "mapbox-gl";
import emailjs from "@emailjs/browser";
import "mapbox-gl/dist/mapbox-gl.css";
import "./Home.css";
import Footer from "../Footer";
import { supabase, getAvailableJets } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import Login from "../components/Login";
import Signup from "../components/Signup";
import UserMenu from "../components/UserMenu";

// Mapbox Token
mapboxgl.accessToken =
  import.meta.env.VITE_MAPBOX_TOKEN ||
  "pk.eyJ1Ijoic3Rlcm9uNCIsImEiOiJjbWd1bTM3cnQwNmJuMmxzYmJheWNsaHhvIn0.qlJrgh9a4_y38iFW0q_ALw";

// --------------------------------------------------
// Galerie-Komponente
// --------------------------------------------------
function JetGallery({ images, jetName }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  let imageArray = images;
  if (typeof imageArray === "string" && imageArray.startsWith("[")) {
    try {
      imageArray = JSON.parse(imageArray);
    } catch (e) {
      console.error("Failed to parse gallery_urls:", e);
      imageArray = [];
    }
  } else if (typeof imageArray === "string") {
    imageArray = [imageArray];
  } else if (!Array.isArray(imageArray)) {
    imageArray = [];
  }

  if (!imageArray || imageArray.length === 0) {
    return (
      <div className="jet-gallery">
        <img
          src={"/jets/default.jpg"}
          alt={jetName}
          className="jet-gallery-image"
        />
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? imageArray.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === imageArray.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <div className="jet-gallery">
      <img
        src={imageArray[currentIndex]}
        alt={`${jetName} gallery image ${currentIndex + 1}`}
        className="jet-gallery-image"
      />
      {imageArray.length > 1 && (
        <>
          <button onClick={goToPrevious} className="gallery-nav prev">
            ‹
          </button>
          <button onClick={goToNext} className="gallery-nav next">
            ›
          </button>
          <div className="gallery-dots">
            {imageArray.map((_, index) => (
              <span
                key={index}
                className={`dot ${index === currentIndex ? "active" : ""}`}
                onClick={() => setCurrentIndex(index)}
              ></span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// --------------------------------------------------
// =======================================
//  GENERISCHE HILFSFUNKTIONEN
// =======================================

// Null-safe lowercase
const safeLower = (v) => (v || "").toString().toLowerCase();

// Einfacher Levenshtein für Fuzzy-Suche
const levenshtein = (a, b) => {
  const s = safeLower(a);
  const t = safeLower(b);
  const m = s.length;
  const n = t.length;
  if (!m) return n;
  if (!n) return m;

  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;

  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      if (s[i - 1] === t[j - 1]) {
        dp[j] = prev;
      } else {
        dp[j] = Math.min(prev + 1, dp[j] + 1, dp[j - 1] + 1);
      }
      prev = tmp;
    }
  }
  return dp[n];
};

// Normalisiert Text: Umlaute + Akzente werden entfernt, alles klein
const normalizeText = (str) =>
  (str || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Akzent-Zeichen entfernen
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .toLowerCase()
    .trim();

// Beliebte Airports → Ranking-Boost
const POPULAR_AIRPORTS_RANK = {
  FRA: 3,
  MUC: 3,
  BER: 2,
  HAM: 1,
  DUS: 1,
  CGN: 1,
  ZRH: 2,
  GVA: 2,
  VIE: 2,
  AMS: 2,
  CDG: 2,
  BCN: 1,
  MAD: 1,
  MXP: 1,
  FCO: 1,
  LHR: 3,
  LGW: 2,
  STN: 1,
  MAN: 1,
  JFK: 3,
  EWR: 2,
  LGA: 2,
  LAX: 3,
  SFO: 2,
  MIA: 2,
  ORD: 2,
  DXB: 3,
  SIN: 2,
};

// ❗ SPEZIAL-ALIASE – hier kannst du alles abbilden, was User tippen könnten
// Alle Keys sind schon normalisiert (also ohne Umlaute/Accente)
const SPECIAL_ALIAS_MAP = {
  MUC: [
    "m",
    "mu",
    "mü",
    "mue",
    "muen",
    "muench",
    "muenchen",
    "mun",
    "muni",
    "munic",
    "munich",
    "munchen",
  ],
  LEJ: ["le", "lei", "leip", "leipz", "leipzig"],
  JFK: ["ny", "nyc", "newy", "newyo", "newyork", "jfk"],
  EWR: ["ewr", "newark"],
  LHR: ["lhr", "heathrow", "london heathrow"],
};

// Haupt-Suchfunktion: Spezial-Alias → City/IATA → Fuzzy
const buildGetSuggestions = (airports) => (input) => {
  if (!input || !Array.isArray(airports) || airports.length === 0) return [];

  const q = normalizeText(input);
  if (!q) return [];

  const results = [];
  const seenIatas = new Set();

  // 1) Spezial-Alias: mün / mü / lei / nyc / ...
  Object.entries(SPECIAL_ALIAS_MAP).forEach(([iata, patterns]) => {
    const iataUpper = iata.toUpperCase();
    const matchesAlias = patterns.some((p) => {
      const normP = normalizeText(p);
      return (
        q === normP ||
        q.startsWith(normP) ||
        normP.startsWith(q)
      );
    });

    if (matchesAlias) {
      const target = airports.find(
        (a) => (a.iata || "").toUpperCase() === iataUpper
      );
      if (target && !seenIatas.has(iataUpper)) {
        results.push({
          a: target,
          score: 0,
          pop: POPULAR_AIRPORTS_RANK[iataUpper] || 0,
        });
        seenIatas.add(iataUpper);
      }
    }
  });

  // 2) Normale Matches (City / IATA mit Normalisierung)
  airports.forEach((a) => {
    if (!a) return;
    const iataUpper = (a.iata || "").toUpperCase();
    if (seenIatas.has(iataUpper)) return;

    const cityNorm = normalizeText(a.city);
    const iataNorm = normalizeText(a.iata);

    let score = Infinity;

    if (cityNorm.startsWith(q)) score = 1;
    else if (cityNorm.includes(q)) score = 2;
    else if (iataNorm.startsWith(q)) score = 3;
    else if (iataNorm.includes(q)) score = 4;

    if (score < Infinity) {
      results.push({
        a,
        score,
        pop: POPULAR_AIRPORTS_RANK[iataUpper] || 0,
      });
      seenIatas.add(iataUpper);
    }
  });

  // 3) Fuzzy-Fallback (wenn noch wenig Treffer)
  if (results.length < 5 && q.length >= 3) {
    airports.forEach((a) => {
      if (!a) return;
      const iataUpper = (a.iata || "").toUpperCase();
      if (seenIatas.has(iataUpper)) return;

      const cityNorm = normalizeText(a.city);
      const iataNorm = normalizeText(a.iata);

      const dist = Math.min(
        levenshtein(cityNorm, q),
        levenshtein(iataNorm, q)
      );

      if (dist <= 2) {
        results.push({
          a,
          score: 10 + dist,
          pop: POPULAR_AIRPORTS_RANK[iataUpper] || 0,
        });
        seenIatas.add(iataUpper);
      }
    });
  }

  // 4) Sortierung: Score → Popularität → City-Name
  results.sort((x, y) => {
    if (x.score !== y.score) return x.score - y.score;
    if (x.pop !== y.pop) return y.pop - x.pop;
    const cityA = (x.a.city || "").toString();
    const cityB = (y.a.city || "").toString();
    return cityA.localeCompare(cityB);
  });

  return results.slice(0, 30).map((r) => r.a);
};


// Distanzberechnung (Haversine)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function Home() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const { isAuthenticated, profile } = useAuth();
  const navigate = useNavigate(); // für spätere Phasen

  // EmailJS / Templates
  const emailServiceId =
    import.meta.env.VITE_EMAIL_SERVICE || "service_cw6x40c";
  const emailPublicKey =
    import.meta.env.VITE_EMAIL_PUBLIC_KEY || "IxnCuOKoR-MuFZVQw";
  const templateGenerisch = "template_d5xee9b";

  const [booking, setBooking] = useState(null);
  const [smartRequest, setSmartRequest] = useState(false);
  const [airports, setAirports] = useState([]);
  const [filterType, setFilterType] = useState("Alle Typen");
  const [filterSeats, setFilterSeats] = useState("Alle Sitzplätze");
  const [hoverInfo, setHoverInfo] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const [smartResult, setSmartResult] = useState(null);
  const [showHotDeals, setShowHotDeals] = useState(false);
  const [selectedEmptyLeg, setSelectedEmptyLeg] = useState(null);
  const [toast, setToast] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [emptyLegs, setEmptyLegs] = useState([]);
  const [jets, setJets] = useState([]);
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);


  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getDefaultDateTime = (hoursInFuture = 4) => {
    const now = new Date();
    now.setHours(now.getHours() + hoursInFuture, 0, 0, 0);

    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    from: "",
    to: "",
    name: "",
    email: "",
    phone: "",
    dateTime: getDefaultDateTime(4),
    returnDate: "",
    roundtrip: false,
    passengers: 1,
  });

  // Suggestions-Funktion auf Basis der geladenen Airports
  const getSuggestions = buildGetSuggestions(airports);

  // Airport-Auflösung: nimm einfach den besten Vorschlag von getSuggestions
  const resolveAirport = (input) => {
    if (!input) return null;
    const suggestions = getSuggestions(input);
    return suggestions.length > 0 ? suggestions[0] : null;
  };

  // Route berechnen (wird v.a. für Preis/Info bei Direktbuchung verwendet)
  const calculateRoute = (from, to) => {
    if (!from || !to) return null;

    const fromUpper = (from || "").toString().toUpperCase().trim();
    const toUpper = (to || "").toString().toUpperCase().trim();

    let start = null;
    let dest = null;

    // 1) Versuche direkten IATA-Match
    if (fromUpper.length === 3) {
      start = airports.find(
        (a) => (a.iata || "").toUpperCase() === fromUpper
      );
    }
    if (toUpper.length === 3) {
      dest = airports.find(
        (a) => (a.iata || "").toUpperCase() === toUpper
      );
    }

    // 2) Falls das nicht klappt: resolveAirport (Alias/Fuzzy)
    if (!start) start = resolveAirport(from);
    if (!dest) dest = resolveAirport(to);

    if (!start || !dest) {
      console.warn(`Konnte Flughafen nicht finden: ${from} oder ${to}`);
      return null;
    }

    const distanceKm = calculateDistance(
      start.lat,
      start.lon,
      dest.lat,
      dest.lon
    );
    const durationHrs = distanceKm / 800;
    return { distanceKm, durationHrs, start, dest };
  };

  // Preisberechnung
  const calculatePrice = (distanceKm, jet, roundtrip = false) => {
    let base = 2500;
    let perKm = 25;

    if (jet.price_per_km) {
      perKm = jet.price_per_km;
    } else if (jet.type) {
      if (jet.type === "Very Light Jet") perKm = 22;
      else if (jet.type === "Light Jet") perKm = 25;
      else if (jet.type === "Super Light Jet") perKm = 30;
      else if (jet.type === "Midsize Jet") perKm = 28;
      else if (jet.type === "Super Midsize Jet") perKm = 32;
      else if (jet.type === "Heavy Jet") perKm = 35;
      else if (jet.type === "Ultra Long Range") perKm = 40;
      else perKm = 27;
    }

    let total = base + distanceKm * perKm;
    total = Math.max(total, jet.min_booking_price || 5000);

    if (roundtrip) {
      total = total * 1.8;
    }
    return total.toFixed(0);
  };
    // Schöne Anzeige für IATA -> "Stadt (IATA)"
  const formatAirportLabel = (input) => {
    if (!input) return "";
    const code = (input || "").toString().trim();
    const upper = code.toUpperCase();

    const airport =
      airports.find((a) => (a.iata || "").toUpperCase() === upper) || null;

    if (airport) {
      return `${airport.city} (${airport.iata})`;
    }
    return input; // Fallback, falls kein Match
  };


  // --------------------------------------------------
  // Daten laden (Empty Legs, Jets, Airports)
  // --------------------------------------------------

  // Empty Legs
  useEffect(() => {
    const loadEmptyLegs = async () => {
      try {
        const { data, error } = await supabase
          .from("active_empty_legs")
          .select("*");
        if (error) throw error;
        const transformed = (data || []).map((leg) => ({
          id: leg.id,
          from: leg.from_iata,
          fromIATA: leg.from_iata,
          to: leg.to_iata,
          toIATA: leg.to_iata,
          fromLat: leg.from_lat,
          fromLng: leg.from_lng,
          toLat: leg.to_lat,
          toLng: leg.to_lng,
          jetName: leg.jet_name,
          jetType: leg.jet_type,
          seats: leg.seats,
          normalPrice: leg.normal_price,
          discountedPrice: leg.discounted_price,
          discount: leg.discount,
          availableUntil: new Date(leg.available_until),
          reason: leg.reason || "Verfügbar",
          departureDate: leg.departure_date,
          jetId: leg.jet_id,
        }));
        setEmptyLegs(transformed);
      } catch (err) {
        console.error("Error loading empty legs:", err);
      }
    };

    loadEmptyLegs();

    const emptyLegsChannel = supabase
      .channel("empty_legs_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "empty_legs" },
        () => {
          loadEmptyLegs();
        }
      )
      .subscribe();

    return () => {
      emptyLegsChannel.unsubscribe();
    };
  }, []);

  // Jets
  useEffect(() => {
    const loadJets = async () => {
      const { data, error } = await getAvailableJets();
      if (error) {
        console.error("❌ Error loading jets:", error);
        setError("Jets konnten nicht geladen werden.");
      } else {
        setJets(data || []);
      }
    };
    loadJets();

    const jetsChannel = supabase
      .channel("jets_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jets" },
        () => {
          loadJets();
        }
      )
      .subscribe();

    return () => {
      jetsChannel.unsubscribe();
    };
  }, []);

  // Airports
  useEffect(() => {
    const loadAirports = async () => {
      try {
        const { data, error } = await supabase
          .from("airports")
          .select("iata, city, lat, lon")
          .order("iata", { ascending: true })
          .limit(10000);
        if (error) throw error;
        setAirports(data || []);
      } catch (err) {
        console.error("Fehler beim Laden der Flughäfen:", err);
        setError("Die globale Flughafenliste konnte nicht geladen werden.");
      }
    };
    loadAirports();
  }, []);

  // Profil in Formular übernehmen
  useEffect(() => {
    if (isAuthenticated && profile) {
      setFormData((prev) => ({
        ...prev,
        name: profile.company_name || profile.full_name || "",
        email: profile.email || "",
      }));
    }
  }, [isAuthenticated, profile]);

  const getJetColor = (type) => {
    const colors = {
      "Very Light Jet": "#10b981",
      "Light Jet": "#3b82f6",
      "Super Light Jet": "#8b5cf6",
      "Midsize Jet": "#ec4899",
      "Super Midsize Jet": "#f59e0b",
      "Heavy Jet": "#ef4444",
      "Ultra Long Range": "#6366f1",
    };
    return colors[type] || "#7b2cbf";
  };

  // Map initialisieren
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    const allBounds = new mapboxgl.LngLatBounds();

    jets.forEach((jet) => {
      allBounds.extend([jet.current_lng, jet.current_lat]);
    });
    emptyLegs.forEach((leg) => {
      allBounds.extend([leg.fromLng, leg.fromLat]);
    });

    if (jets.length === 0 && emptyLegs.length === 0) {
      allBounds.extend([2.3522, 48.8566]);
      allBounds.extend([13.405, 52.52]);
    }

    const center = allBounds.getCenter();
    const m = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: allBounds.isEmpty() ? [13.405, 52.52] : [center.lng, center.lat],
      zoom: allBounds.isEmpty() ? 4 : 3.5,
    });

    map.current = m;

    if (!allBounds.isEmpty()) {
      m.on("load", () => {
        setTimeout(() => {
          m.fitBounds(allBounds, {
            padding: 100,
            duration: 2500,
            maxZoom: 5.5,
            essential: true,
          });
        }, 500);
      });
    }
  }, [jets, emptyLegs]);

  // Marker für Jets + Hot Deals
  useEffect(() => {
    if (!map.current) return;

    // Alte Marker entfernen
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // 1) Jet-Marker
    const jetsWithValidPositions = jets.filter((jet) => {
      const lat = jet.current_lat;
      const lng = jet.current_lng;
      if (lat == null || lng == null) return false;
      const latNum = Number(lat);
      const lngNum = Number(lng);
      if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return false;
      return true;
    });

    const visibleJets = jetsWithValidPositions.filter((jet) => {
      const typeOk = filterType === "Alle Typen" || jet.type === filterType;

      const seats = jet.seats || 0;
      let seatsOk = true;

      if (filterSeats === "1–4") seatsOk = seats <= 4;
      else if (filterSeats === "5–8") seatsOk = seats >= 5 && seats <= 8;
      else if (filterSeats === "9–12") seatsOk = seats >= 9 && seats <= 12;
      else if (filterSeats === "13+") seatsOk = seats > 12;

      return typeOk && seatsOk;
    });

    visibleJets.forEach((jet) => {
      const el = document.createElement("div");
      el.className = "jet-marker";
      el.style.backgroundImage = 'url("/jet.png")';
      el.style.backgroundSize = "contain";
      el.style.backgroundRepeat = "no-repeat";
      el.style.backgroundPosition = "center";
      el.style.width = "55px";
      el.style.height = "55px";
      el.style.cursor = "pointer";

      const statusColor =
        jet.status === "in_flight" ? "#6366f1" : "#10b981";

      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; text-align: center;">
          <img src="${jet.image_url || "/jets/default.jpg"}"
               alt="${jet.name}"
               style="width: 100%; height: 120px; object-fit: cover; border-radius: 6px 6px 0 0; margin-bottom: 8px;">
          <div style="padding: 0 10px 10px 10px;">
            <strong style="font-size: 1.1rem; color: #111;">${jet.name}</strong><br/>
            <span style="color: ${getJetColor(jet.type)}; font-weight: 600;">
              ${jet.type}${jet.year_built ? ` (${jet.year_built})` : ""}
            </span><br/>
            <small style="color: #333;">
              ${jet.current_iata} • ${jet.seats} Sitze • ${jet.range} km
            </small><br/>
            <small style="color: #333; font-weight: 600;">
              ⏱️ ${jet.lead_time_hours}h Vorlaufzeit
            </small><br/>
            <span style="color: ${statusColor}; font-weight: 600; font-size: 0.9rem;">
              ● ${jet.status}
            </span>
          </div>
        </div>
      `;

      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        closeOnClick: false,
        className: "jet-popup",
      }).setHTML(popupHtml);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([Number(jet.current_lng), Number(jet.current_lat)])
        .setPopup(popup)
        .addTo(map.current);

      markersRef.current.push(marker);

      el.addEventListener("click", () => {
        marker.getPopup().remove();
        setBooking(jet);
        setFormData((prev) => ({
          ...prev,
          from: jet.current_iata,
          to: "",
          name: profile ? profile.full_name || profile.company_name : "",
          email: profile ? profile.email : "",
          phone: "",
          dateTime: getDefaultDateTime(jet.lead_time_hours || 4),
          returnDate: "",
          roundtrip: false,
          passengers: 1,
        }));
        setRouteInfo(null);
      });

      el.addEventListener("mouseenter", () => {
        if (!marker.getPopup().isOpen()) {
          marker.getPopup().addTo(map.current);
        }
      });
      el.addEventListener("mouseleave", () => {
        marker.getPopup().remove();
      });
    });

    // 2) Hot Deals Marker
    emptyLegs.forEach((leg) => {
      const container = document.createElement("div");
      container.style.width = "55px";
      container.style.height = "55px";

      const el = document.createElement("div");
      el.style.backgroundImage = 'url("/jet1.png")';
      el.style.backgroundSize = "contain";
      el.style.backgroundRepeat = "no-repeat";
      el.style.backgroundPosition = "center";
      el.style.width = "100%";
      el.style.height = "100%";
      el.style.cursor = "pointer";
      el.style.filter =
        "drop-shadow(0 6px 16px rgba(239, 68, 68, 0.8))";
      el.style.transition = "transform 0.2s ease";

      container.appendChild(el);

      const hoursLeft = Math.max(
        0,
        Math.floor((leg.availableUntil - new Date()) / (1000 * 60 * 60))
      );

      const popupHtml = `
        <div style="padding: 10px; text-align: center; min-width: 180px; font-family: system-ui, sans-serif;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #f97316 100%);
                      color: white; padding: 4px 8px; border-radius: 6px;
                      margin-bottom: 6px; font-weight: 700; font-size: 11px;">
            🔥 HOT DEAL -${leg.discount}%
          </div>
          <strong style="font-size: 14px;">${leg.from} → ${leg.to}</strong><br/>
          <span style="color: #7b2cbf; font-weight: 600;">${leg.jetName}</span><br/>
          <small style="color: #666;">${leg.jetType} • ${leg.seats} Sitze</small><br/>
          <div style="margin-top: 6px;">
            <span style="text-decoration: line-through; color: #999; font-size: 12px;">
              €${leg.normalPrice.toLocaleString()}
            </span>
            <span style="color: #ef4444; font-weight: 700; font-size: 16px; margin-left: 8px;">
              €${leg.discountedPrice.toLocaleString()}
            </span>
          </div>
          <small style="color: #f97316; font-weight: 600;">
            ⏰ Noch ${hoursLeft}h verfügbar
          </small>
        </div>
      `;

      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        closeOnClick: false,
      }).setHTML(popupHtml);

      const marker = new mapboxgl.Marker(container)
        .setLngLat([leg.fromLng, leg.fromLat])
        .setPopup(popup)
        .addTo(map.current);

      markersRef.current.push(marker);

      container.addEventListener("click", () => {
        marker.getPopup().remove();
        setSelectedEmptyLeg(leg);
        setFormData((prev) => ({
          ...prev,
          passengers: 1,
          name: profile ? profile.full_name || profile.company_name : "",
          email: profile ? profile.email : "",
          phone: "",
        }));
      });

      container.addEventListener("mouseenter", () => {
        el.style.transform = "scale(1.15)";
        if (!marker.getPopup().isOpen()) {
          marker.getPopup().addTo(map.current);
        }
      });
      container.addEventListener("mouseleave", () => {
        el.style.transform = "scale(1)";
        marker.getPopup().remove();
      });
    });
  }, [filterType, filterSeats, jets, emptyLegs, profile]);

  // Route-Info berechnen, wenn im Direktbuchungs-Modal From/To gewählt sind
  useEffect(() => {
    if (!formData.from || formData.from.length < 3) {
      setRouteInfo(null);
      return;
    }
    if (!formData.to || formData.to.length < 3) {
      setRouteInfo(null);
      return;
    }
    if (airports.length > 0 && booking) {
      const route = calculateRoute(formData.from, formData.to);
      if (route) {
        setRouteInfo(route);
        if (route.start && route.dest && map.current) {
          map.current.fitBounds(
            [
              [route.start.lon, route.start.lat],
              [route.dest.lon, route.dest.lat],
            ],
            { padding: 100, duration: 1500 }
          );
        }
      } else {
        setRouteInfo(null);
      }
    } else {
      setRouteInfo(null);
    }
  }, [formData.from, formData.to, formData.roundtrip, airports, booking]);

  // --------------------------------------------------
  // Handler
  // --------------------------------------------------
  const handleSelectAirport = (field, airport) => {
    // Wir schreiben nur den IATA-Code ins Feld (z.B. "MUC", "LEJ")
    setFormData((prev) => ({
      ...prev,
      [field]: airport.iata,
    }));

    if (field === "from") {
      setFromSuggestions([]);
    } else if (field === "to") {
      setToSuggestions([]);
    }
  };

  const handleSmartRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSmartResult(null);

    if (!isAuthenticated) {
      showToast("Bitte zuerst anmelden, um anzufragen.", "error");
      setShowLogin(true);
      setLoading(false);
      return;
    }

    const startAirport = resolveAirport(formData.from);
    const destAirport = resolveAirport(formData.to);

    if (!startAirport || !destAirport) {
      setError("Start- oder Zielflughafen ungültig.");
      showToast("Fehler: Start- oder Zielflughafen ungültig.", "error");
      setLoading(false);
      return;
    }

    const requestBody = {
      fromIATA: startAirport.iata,
      toIATA: destAirport.iata,
      passengers: parseInt(formData.passengers, 10),
      dateTime: formData.dateTime,
    };

    try {
      const { data: bestMatch, error: functionError } =
        await supabase.functions.invoke("ai-jet-match", {
          body: requestBody,
        });

      if (functionError) throw functionError;

      const route = calculateRoute(startAirport.iata, destAirport.iata);

      setSmartResult({
        jet: bestMatch.jet,
        jetType: bestMatch.jet.type,
        distance: bestMatch.ferryDistanceKm,
        flightDistance: route ? route.distanceKm.toFixed(0) : "–",
        range: bestMatch.jet.range,
        seats: bestMatch.jet.seats,
        price: bestMatch.price,
        totalLeadTime: bestMatch.totalLeadTimeHours,
        fromIATA: startAirport.iata,
        toIATA: destAirport.iata,
      });
    } catch (err) {
      console.error("Fehler beim Aufruf der AI-Function:", err);

      let displayErrorMessage = "Ein unbekannter Serverfehler ist aufgetreten.";

      if (err.context && err.context.error) {
        const backendError = err.context.error;
        if (backendError.details) {
          displayErrorMessage = backendError.details;
        } else if (backendError.error) {
          displayErrorMessage = backendError.error;
        } else {
          displayErrorMessage = err.message;
        }
      } else if (err.message) {
        displayErrorMessage = err.message;
      }

      if (
        displayErrorMessage.includes(
          "Edge Function returned a non-2xx status code"
        ) ||
        displayErrorMessage.includes("Kein passender Jet gefunden")
      ) {
        displayErrorMessage =
          "Vorlaufzeit zu kurz. Bitte wählen Sie einen späteren Abflugzeitpunkt.";
      }

      showToast(`❌ Fehler: ${displayErrorMessage}`, "error");
      setSmartResult({ error: true, message: displayErrorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleSmartBookingSubmit = async () => {
    if (!smartResult || !smartResult.jet) {
      showToast("Fehler: Kein Jet ausgewählt.", "error");
      return;
    }

    setLoading(true);
    const bookingData = {
      company_id: smartResult.jet.company_id,
      jet_id: smartResult.jet.id,
      from_location: formData.from.toUpperCase(),
      from_iata: smartResult.fromIATA,
      to_location: formData.to.toUpperCase(),
      to_iata: smartResult.toIATA,
      departure_date: formData.dateTime,
      return_date: formData.roundtrip ? formData.returnDate : null,
      total_price: smartResult.price,
      status: "pending",
      customer_name: formData.name,
      customer_email: formData.email,
      customer_phone: formData.phone,
      jet_name: smartResult.jet.name,
      jet_type: smartResult.jet.type,
      passengers: parseInt(formData.passengers, 10),
    };

    try {
      const { data: bookingEntry, error: dbError } = await supabase
        .from("bookings")
        .insert(bookingData)
        .select()
        .single();
      if (dbError) throw dbError;

      // E-Mail an Kunden
      try {
        const kundenParams = {
          recipient_email: bookingData.customer_email,
          subject: `Ihre JetOpti-Anfrage (${bookingEntry.id}) ist in Bearbeitung`,
          name_an: bookingData.customer_name,
          nachricht: `Vielen Dank für Ihre Anfrage (ID: ${bookingEntry.id}) für die Route ${bookingData.from_location} → ${bookingData.to_location}. Wir prüfen die Verfügbarkeit bei der Charterfirma und melden uns in Kürze.`,
          route: `${bookingData.from_location} → ${bookingData.to_location}`,
          jet_name: bookingData.jet_name,
          departure_date: new Date(
            bookingData.departure_date
          ).toLocaleString("de-DE"),
          customer_name: bookingData.customer_name,
          customer_email: bookingData.customer_email,
          customer_phone: bookingData.customer_phone || "N/A",
          total_price: bookingData.total_price.toLocaleString(),
          booking_id: bookingEntry.id,
        };
        await emailjs.send(
          emailServiceId,
          templateGenerisch,
          kundenParams,
          emailPublicKey
        );
      } catch (emailError) {
        console.warn(
          "⚠️ E-Mail (Anfrage-Kunde) konnte nicht gesendet werden:",
          emailError
        );
      }

      // E-Mail an Charter
      try {
        const charterParams = {
          recipient_email: "steron4@web.de",
          subject: `NEUE ANFRAGE (${bookingEntry.id}): ${bookingData.from_location} → ${bookingData.to_location}`,
          name_an: "JetOpti Partner",
          nachricht:
            "Eine neue Buchungsanfrage ist eingetroffen. Bitte prüfen Sie die Details in Ihrem Dashboard und bestätigen oder lehnen Sie die Anfrage ab.",
          route: `${bookingData.from_location} → ${bookingData.to_location}`,
          jet_name: bookingData.jet_name,
          departure_date: new Date(
            bookingData.departure_date
          ).toLocaleString("de-DE"),
          customer_name: bookingData.customer_name,
          customer_email: bookingData.customer_email,
          customer_phone: bookingData.customer_phone || "N/A",
          total_price: bookingData.total_price.toLocaleString(),
          booking_id: bookingEntry.id,
        };
        await emailjs.send(
          emailServiceId,
          templateGenerisch,
          charterParams,
          emailPublicKey
        );
      } catch (emailError) {
        console.warn(
          "⚠️ E-Mail (Anfrage-Charter) konnte nicht gesendet werden:",
          emailError
        );
      }

      const { error: jetUpdateError } = await supabase
        .from("jets")
        .update({ status: "wartung" })
        .eq("id", smartResult.jet.id);

      if (jetUpdateError) {
        console.error("Fehler beim Reservieren des Jets:", jetUpdateError);
      }

      showToast(
        "✅ Anfrage erfolgreich gesendet! Die Charterfirma wird sich bei Ihnen melden.",
        "success"
      );
      setSmartRequest(false);
      setSmartResult(null);
      setFormData((prev) => ({
        ...prev,
        from: "",
        to: "",
        dateTime: getDefaultDateTime(4),
        returnDate: "",
        roundtrip: false,
        passengers: 1,
      }));
    } catch (err) {
      console.error("Fehler beim Smart Request Buchen:", err);
      showToast(`❌ Fehler: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDirectBooking = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!isAuthenticated) {
      showToast("Bitte zuerst anmelden, um anzufragen.", "error");
      setShowLogin(true);
      setLoading(false);
      return;
    }

    if (!routeInfo || !booking) {
      setError("Buchungs- oder Routen-Infos fehlen.");
      setLoading(false);
      return;
    }

    const departureTime = new Date(formData.dateTime);
    const now = new Date();
    const hoursUntilFlight = (departureTime - now) / 3600000;
    const jetLeadTime = booking.lead_time_hours || 4;

    if (hoursUntilFlight < jetLeadTime) {
      showToast(
        `Fehler: Die Vorlaufzeit dieses Jets beträgt ${jetLeadTime} Stunden. Bitte wählen Sie eine spätere Uhrzeit.`,
        "error"
      );
      setLoading(false);
      return;
    }

    const finalPrice = calculatePrice(
      routeInfo.distanceKm,
      booking,
      formData.roundtrip
    );

    const bookingData = {
      company_id: booking.company_id,
      jet_id: booking.id,
      from_location: formData.from.toUpperCase(),
      from_iata: routeInfo.start.iata,
      to_location: formData.to.toUpperCase(),
      to_iata: routeInfo.dest.iata,
      departure_date: formData.dateTime,
      return_date: formData.roundtrip ? formData.returnDate : null,
      total_price: finalPrice,
      status: "pending",
      customer_name: formData.name,
      customer_email: formData.email,
      customer_phone: formData.phone,
      jet_name: booking.name,
      jet_type: booking.type,
      passengers: parseInt(formData.passengers, 10),
    };

    try {
      const { data: bookingEntry, error: dbError } = await supabase
        .from("bookings")
        .insert(bookingData)
        .select()
        .single();

      if (dbError) throw dbError;

      // E-Mail an Kunden
      try {
        const kundenParams = {
          recipient_email: bookingData.customer_email,
          subject: `Ihre JetOpti-Anfrage (${bookingEntry.id}) ist in Bearbeitung`,
          name_an: bookingData.customer_name,
          nachricht: `Vielen Dank für Ihre Anfrage (ID: ${bookingEntry.id}) für die Route ${bookingData.from_location} → ${bookingData.to_location}. Wir prüfen die Verfügbarkeit bei der Charterfirma und melden uns in Kürze.`,
          route: `${bookingData.from_location} → ${bookingData.to_location}`,
          jet_name: bookingData.jet_name,
          departure_date: new Date(
            bookingData.departure_date
          ).toLocaleString("de-DE"),
          customer_name: bookingData.customer_name,
          customer_email: bookingData.customer_email,
          customer_phone: bookingData.customer_phone || "N/A",
          total_price: bookingData.total_price.toLocaleString(),
          booking_id: bookingEntry.id,
        };
        await emailjs.send(
          emailServiceId,
          templateGenerisch,
          kundenParams,
          emailPublicKey
        );
      } catch (emailError) {
        console.warn(
          "⚠️ E-Mail (Anfrage-Kunde) konnte nicht gesendet werden:",
          emailError
        );
      }

      // E-Mail an Charter
      try {
        const charterParams = {
          recipient_email: "steron4@web.de",
          subject: `NEUE ANFRAGE (${bookingEntry.id}): ${bookingData.from_location} → ${bookingData.to_location}`,
          name_an: "JetOpti Partner",
          nachricht:
            "Eine neue Buchungsanfrage ist eingetroffen. Bitte prüfen Sie die Details in Ihrem Dashboard und bestätigen oder lehnen Sie die Anfrage ab.",
          route: `${bookingData.from_location} → ${bookingData.to_location}`,
          jet_name: bookingData.jet_name,
          departure_date: new Date(
            bookingData.departure_date
          ).toLocaleString("de-DE"),
          customer_name: bookingData.customer_name,
          customer_email: bookingData.customer_email,
          customer_phone: bookingData.customer_phone || "N/A",
          total_price: bookingData.total_price.toLocaleString(),
          booking_id: bookingEntry.id,
        };
        await emailjs.send(
          emailServiceId,
          templateGenerisch,
          charterParams,
          emailPublicKey
        );
      } catch (emailError) {
        console.warn(
          "⚠️ E-Mail (Anfrage-Charter) konnte nicht gesendet werden:",
          emailError
        );
      }

      const { error: jetUpdateError } = await supabase
        .from("jets")
        .update({ status: "wartung" })
        .eq("id", booking.id);

      if (jetUpdateError) {
        console.error(
          "⚠️ Jet-Status konnte nicht aktualisiert werden:",
          jetUpdateError
        );
      }

      showToast("✅ Buchungsanfrage erfolgreich gesendet!", "success");
      setBooking(null);
      setFormData((prev) => ({
        ...prev,
        from: "",
        to: "",
        dateTime: getDefaultDateTime(4),
        returnDate: "",
        roundtrip: false,
        passengers: 1,
      }));
      setRouteInfo(null);
    } catch (err) {
      console.error("Fehler bei Direktbuchung:", err);
      showToast(`❌ Fehler: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

   const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Nur für Flughafenfelder: Vorschläge aktualisieren
    if (name === "from") {
      if (!newValue || newValue.trim().length === 0) {
        setFromSuggestions([]);
      } else {
        setFromSuggestions(getSuggestions(newValue).slice(0, 10));
      }
    } else if (name === "to") {
      if (!newValue || newValue.trim().length === 0) {
        setToSuggestions([]);
      } else {
        setToSuggestions(getSuggestions(newValue).slice(0, 10));
      }
    }
  };


  const estimatedPrice =
    routeInfo && booking
      ? calculatePrice(routeInfo.distanceKm, booking, formData.roundtrip)
      : null;

  // --------------------------------------------------
  // JSX / Render
  // --------------------------------------------------
  return (
    <div className="App">
      {/* Auth Buttons */}
      <div
        style={{
          position: "fixed",
          top: "20px",
          right: "30px",
          zIndex: 10000,
          display: "flex",
          gap: "12px",
        }}
      >
        {isAuthenticated ? (
          <UserMenu />
        ) : (
          <>
            <button
              onClick={() => setShowLogin(true)}
              style={{
                padding: "10px 24px",
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(10px)",
                border: "2px solid #8b5cf6",
                borderRadius: "12px",
                color: "#8b5cf6",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "15px",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#8b5cf6";
                e.target.style.color = "white";
                e.target.style.transform = "translateY(-3px) scale(1.02)";
                e.target.style.boxShadow =
                  "0 8px 25px rgba(139, 92, 246, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "rgba(255, 255, 255, 0.95)";
                e.target.style.color = "#8b5cf6";
                e.target.style.transform = "translateY(0) scale(1)";
                e.target.style.boxShadow =
                  "0 4px 15px rgba(0,0,0,0.2)";
              }}
            >
              Anmelden
            </button>

            <button
              onClick={() => setShowSignup(true)}
              style={{
                padding: "10px 24px",
                background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                border: "none",
                borderRadius: "12px",
                color: "white",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "15px",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 15px rgba(139, 92, 246, 0.4)",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-3px) scale(1.02)";
                e.target.style.boxShadow =
                  "0 8px 30px rgba(139, 92, 246, 0.6)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0) scale(1)";
                e.target.style.boxShadow =
                  "0 4px 15px rgba(139, 92, 246, 0.4)";
              }}
            >
              Registrieren
            </button>
          </>
        )}
      </div>

      {/* Header (AI Jet Match + Filter) */}
      <div
        className="overlay-header"
        style={{
          justifyContent: "flex-start",
          alignItems: "center",
          paddingLeft: "20px",
          paddingTop: "20px",
        }}
      >
        <img
          src="/icons/logo.png"
          alt="JetOpti Logo"
          className="brand-logo"
          style={{ height: "120px", width: "auto", marginBottom: "12px" }}
        />
        <div
          className="filters-container"
          style={{ width: "100%", maxWidth: "600px" }}
        >
          <div className="action-buttons">
            <button
              className="smart-btn"
              onClick={() => {
                setSmartRequest(true);
                setSmartResult(null);
                setFormData((prev) => ({
                  ...prev,
                  from: "",
                  to: "",
                  dateTime: getDefaultDateTime(4),
                  returnDate: "",
                  roundtrip: false,
                  passengers: 1,
                }));
              }}
            >
              ✨ AI Jet Match
            </button>
            <button
              className="hot-deals-btn"
              onClick={() => {
                setShowHotDeals(true);
                if (map.current && emptyLegs.length > 0) {
                  const bounds = new mapboxgl.LngLatBounds();
                  emptyLegs.forEach((leg) => {
                    bounds.extend([leg.fromLng, leg.fromLat]);
                  });
                  map.current.fitBounds(bounds, {
                    padding: 100,
                    duration: 1500,
                    maxZoom: 6,
                  });
                }
              }}
            >
              🔥 HOT DEALS ({emptyLegs.length})
            </button>
          </div>
          <div className="filter-selects">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              aria-label="Jet-Typ filtern"
              onMouseEnter={() => setHoverInfo(true)}
              onMouseLeave={() => setHoverInfo(false)}
            >
              <option>Alle Typen</option>
              <option>Very Light Jet</option>
              <option>Light Jet</option>
              <option>Super Light Jet</option>
              <option>Midsize Jet</option>
              <option>Super Midsize Jet</option>
              <option>Heavy Jet</option>
              <option>Ultra Long Range</option>
            </select>
            <select
              value={filterSeats}
              onChange={(e) => setFilterSeats(e.target.value)}
              aria-label="Sitzplätze filtern"
            >
              <option>Alle Sitzplätze</option>
              <option>1–4</option>
              <option>5–8</option>
              <option>9–12</option>
              <option>13+</option>
            </select>
          </div>
        </div>
      </div>

      {/* Map */}
      <div ref={mapContainer} id="map" />

      {/* Hover Info */}
      {hoverInfo && (
        <div className="hover-info">
          <h3>✈️ Jet-Kategorien erklärt</h3>
          <ul>
            <li>
              <strong>Very Light Jet:</strong> 4 Sitze – ideal für kurze
              Strecken.
            </li>
            <li>
              <strong>Light Jet:</strong> 6–8 Sitze – effizient & perfekt für
              Business-Trips.
            </li>
            <li>
              <strong>Super Light Jet:</strong> bis 9 Sitze – mehr Reichweite &
              Komfort.
            </li>
            <li>
              <strong>Midsize Jet:</strong> 8–9 Sitze – geräumiger mit
              Stehhöhe.
            </li>
            <li>
              <strong>Super Midsize Jet:</strong> bis 10 Sitze – größere
              Reichweite, Serviceküche.
            </li>
            <li>
              <strong>Heavy Jet:</strong> 12–16 Sitze – Liegesitze,
              Bordservice, Luxus.
            </li>
            <li>
              <strong>Ultra Long Range:</strong> bis 19 Sitze –
              interkontinental, Highspeed.
            </li>
          </ul>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`toast toast-${toast.type}`}
          style={{ zIndex: 10001 }}
        >
          {toast.message}
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && (
        <div className="booking-modal">
          <div className="booking-content success-modal">
            <div className="success-icon">✅</div>
            <h3>Anfrage erfolgreich gesendet!</h3>
            <p>
              Vielen Dank für deine Buchungsanfrage. Die Charterfirma wird sich
              in Kürze bei Ihnen melden.
            </p>
            <button
              className="confirm"
              onClick={() => setShowSuccess(false)}
            >
              Verstanden
            </button>
          </div>
        </div>
      )}

      {/* Smart Request Modal */}
      {smartRequest && (
        <div className="booking-modal">
          <div className="booking-content">
            <h3>✨ AI Jet Match</h3>
            <p className="modal-description">
              Wir finden automatisch den besten Jet für deine Route
            </p>
            {error && <div className="error-message">⚠️ {error}</div>}

            <form onSubmit={handleSmartRequest}>
              <label htmlFor="smart-from">Startflughafen</label>
<div style={{ position: "relative" }}>
  <input
  id="smart-from"
  type="text"
  name="from"
  placeholder="z.B. FRA oder Frankfurt"
  value={formatAirportLabel(formData.from)}
  onChange={handleChange}
  autoComplete="off"
  required
/>


  {fromSuggestions.length > 0 && (
    <div
      style={{
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "white",
        borderRadius: "8px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
        marginTop: "4px",
        maxHeight: "260px",
        overflowY: "auto",
      }}
    >
      {fromSuggestions.map((a) => (
        <button
          type="button"
          key={a.iata}
          onClick={() => handleSelectAirport("from", a)}
          style={{
            width: "100%",
            textAlign: "left",
            padding: "8px 12px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          <div style={{ fontWeight: 600 }}>
            {a.city || a.iata} ({a.iata})
          </div>
        </button>
      ))}
    </div>
  )}
</div>


              <label htmlFor="smart-to">Zielflughafen</label>
<div style={{ position: "relative" }}>
  <input
  id="smart-to"
  type="text"
  name="to"
  placeholder="z.B. MUC oder München"
  value={formatAirportLabel(formData.to)}
  onChange={handleChange}
  autoComplete="off"
  required
/>


  {toSuggestions.length > 0 && (
    <div
      style={{
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "white",
        borderRadius: "8px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
        marginTop: "4px",
        maxHeight: "260px",
        overflowY: "auto",
      }}
    >
      {toSuggestions.map((a) => (
        <button
          type="button"
          key={a.iata}
          onClick={() => handleSelectAirport("to", a)}
          style={{
            width: "100%",
            textAlign: "left",
            padding: "8px 12px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          <div style={{ fontWeight: 600 }}>
            {a.city || a.iata} ({a.iata})
          </div>
        </button>
      ))}
    </div>
  )}
</div>


              <label htmlFor="smart-date">Abflugdatum und -Uhrzeit</label>
              <input
                id="smart-date"
                type="datetime-local"
                name="dateTime"
                value={formData.dateTime}
                onChange={handleChange}
                min={getDefaultDateTime(0)}
                required
              />

              <label htmlFor="smart-passengers">Anzahl Passagiere</label>
              <select
                id="smart-passengers"
                name="passengers"
                value={formData.passengers}
                onChange={handleChange}
                required
              >
                {[...Array(20)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} {i === 0 ? "Passagier" : "Passagiere"}
                  </option>
                ))}
              </select>

              <label className="checkbox">
                <input
                  type="checkbox"
                  name="roundtrip"
                  checked={formData.roundtrip}
                  onChange={handleChange}
                />{" "}
                Hin- und Rückflug (aktuell nicht unterstützt)
              </label>

              <label htmlFor="smart-name">Dein Name</label>
              <input
                id="smart-name"
                type="text"
                name="name"
                placeholder="Max Mustermann"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isAuthenticated}
              />

              <label htmlFor="smart-email">E-Mail-Adresse</label>
              <input
                id="smart-email"
                type="email"
                name="email"
                placeholder="max@beispiel.de"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isAuthenticated}
              />

              <label htmlFor="smart-phone">Telefon (Optional)</label>
              <input
                id="smart-phone"
                type="tel"
                name="phone"
                placeholder="Für schnelle Rückfragen"
                value={formData.phone}
                onChange={handleChange}
              />

              <div className="buttons">
                <button
                  type="submit"
                  className="confirm"
                  disabled={loading}
                >
                  {loading ? "Suche läuft..." : "Besten Jet finden"}
                </button>
                <button
                  type="button"
                  className="cancel"
                  onClick={() => {
  setSmartRequest(false);
  setSmartResult(null);
  setError(null);
  setFromSuggestions([]);
  setToSuggestions([]);
}}

                >
                  Abbrechen
                </button>
              </div>
            </form>

            {smartResult && !smartResult.error && (
              <div className="smart-estimate">
                <p>
                  <strong>🎯 Perfekter Match gefunden:</strong>
                </p>
                <p>
                  ✈️ Jet: <strong>{smartResult.jet.name}</strong>{" "}
                  {smartResult.jet.year_built
                    ? `(${smartResult.jet.year_built})`
                    : ""}
                </p>
                <p>
                  📊 Typ: <strong>{smartResult.jetType}</strong> •{" "}
                  <strong>{smartResult.seats} Sitze</strong>
                </p>
                <p>
                  📍 Anflugdistanz:{" "}
                  <strong>{smartResult.distance.toFixed(0)} km</strong> (Leerflug)
                </p>
                <p>
                  🛫 Hauptstrecke:{" "}
                  <strong>{smartResult.flightDistance} km</strong>
                </p>
                <p>
                  ⏱️ Gesamt-Vorlauf:{" "}
                  <strong>{smartResult.totalLeadTime.toFixed(1)}h</strong> ✓
                </p>
                <p>
                  💶 Gesamtpreis:{" "}
                  <strong>
                    €{smartResult.price.toLocaleString()}
                  </strong>{" "}
                  (Min. €
                  {smartResult.jet.min_booking_price?.toLocaleString()})
                </p>
                <p className="discount-info">
                  ℹ️ Inkl. Anflugkosten • Der Jet fliegt zu dir!
                </p>

                <div className="buttons" style={{ marginTop: "20px" }}>
                  <button
                    onClick={handleSmartBookingSubmit}
                    className="confirm"
                    disabled={loading}
                  >
                    {loading
                      ? "Wird angefragt..."
                      : "Jetzt unverbindlich anfragen"}
                  </button>
                </div>
              </div>
            )}

            {smartResult && smartResult.error && (
              <div
                className="error-message"
                style={{ marginTop: "15px" }}
              >
                ⚠️ {smartResult.message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Direktbuchung Modal */}
      {booking && (
        <div className="booking-modal">
          <div className="booking-content">
            <h3>{booking.name}</h3>
            <p className="jet-type">
              {booking.type} • {booking.seats} Sitze{" "}
              {booking.year_built ? `(${booking.year_built})` : ""}
            </p>

            <JetGallery
              images={
                booking.gallery_urls && booking.gallery_urls.length > 0
                  ? booking.gallery_urls
                  : [booking.image_url || "/jets/default.jpg"]
              }
              jetName={booking.name}
            />

            {error && <div className="error-message">⚠️ {error}</div>}

            <form onSubmit={handleDirectBooking}>
              <label htmlFor="booking-from">Startflughafen</label>
<input
  id="booking-from"
  type="text"
  value={formatAirportLabel(formData.from)}
  readOnly
  style={{
    backgroundColor: "#f3f4f6",
    cursor: "not-allowed",
    borderColor: "#d1d5db",
  }}
/>



              <label htmlFor="booking-date">
                Abflugdatum und -Uhrzeit
              </label>
              <input
                id="booking-date"
                type="datetime-local"
                name="dateTime"
                value={formData.dateTime}
                onChange={handleChange}
                min={getDefaultDateTime(booking.lead_time_hours || 4)}
                required
              />

              <label htmlFor="booking-passengers">
                Anzahl Passagiere
              </label>
              <select
                id="booking-passengers"
                name="passengers"
                value={formData.passengers}
                onChange={handleChange}
                required
              >
                {[...Array(booking.seats || 8)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} {i === 0 ? "Passagier" : "Passagiere"}
                  </option>
                ))}
              </select>

              <label className="checkbox">
                <input
                  type="checkbox"
                  name="roundtrip"
                  checked={formData.roundtrip}
                  onChange={handleChange}
                />{" "}
                Hin- und Rückflug (+80% Preis)
              </label>

              {formData.roundtrip && (
                <>
                  <label htmlFor="booking-return">
                    Rückflugdatum und -Uhrzeit
                  </label>
                  <input
                    id="booking-return"
                    type="datetime-local"
                    name="returnDate"
                    value={formData.returnDate}
                    onChange={handleChange}
                    min={formData.dateTime}
                    required
                  />
                </>
              )}

              <label htmlFor="booking-name">Dein Name</label>
              <input
                id="booking-name"
                type="text"
                name="name"
                placeholder="Dein Name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isAuthenticated}
              />

              <label htmlFor="booking-email">E-Mail-Adresse</label>
              <input
                id="booking-email"
                type="email"
                name="email"
                placeholder="E-Mail-Adresse"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isAuthenticated}
              />

              <label htmlFor="booking-phone">Telefon (Optional)</label>
              <input
                id="booking-phone"
                type="tel"
                name="phone"
                placeholder="Für schnelle Rückfragen"
                value={formData.phone}
                onChange={handleChange}
              />

              {routeInfo && (
                <div className="route-summary">
                  <p>
                    ✈️ Distanz:{" "}
                    <strong>
                      {routeInfo.distanceKm.toFixed(0)} km
                    </strong>
                  </p>
                  <p>
                    ⏱️ Flugdauer:{" "}
                    <strong>
                      {routeInfo.durationHrs.toFixed(1)} Stunden
                    </strong>
                  </p>
                  <p className="price-line">
                    💶 Geschätzter Preis:{" "}
                    <strong>€{estimatedPrice}</strong> (Min. €
                    {booking.min_booking_price?.toLocaleString()})
                  </p>
                  {formData.roundtrip && (
                    <p className="roundtrip-note">
                      ↔️ Hin- und Rückflug inklusive
                    </p>
                  )}
                </div>
              )}

              <div className="buttons">
                <button
                  type="submit"
                  className="confirm"
                  disabled={loading}
                >
                  {loading
                    ? "Wird gesendet..."
                    : "Unverbindlich anfragen"}
                </button>
                <button
                  type="button"
                  className="cancel"
                  onClick={() => {
  setBooking(null);
  setRouteInfo(null);
  setError(null);
  setFromSuggestions([]);
  setToSuggestions([]);
}}

                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hot Deals Modal */}
      {showHotDeals && (
        <div className="booking-modal">
          <div className="booking-content hot-deals-content">
            <h3>🔥 Hot Deals - Empty Legs</h3>
            <p className="modal-description">
              Leerflüge mit bis zu 50% Rabatt!
            </p>
            <div className="empty-legs-list">
              {emptyLegs.map((leg) => {
                const hoursLeft = Math.max(
                  0,
                  Math.floor(
                    (leg.availableUntil - new Date()) / (1000 * 60 * 60)
                  )
                );
                const minutesLeft = Math.max(
                  0,
                  Math.floor(
                    ((leg.availableUntil - new Date()) %
                      (1000 * 60 * 60)) /
                      (1000 * 60)
                  )
                );
                return (
                  <div key={leg.id} className="empty-leg-card">
                    <div className="leg-header">
                      <span className="leg-route">
                        {leg.from} → {leg.to}
                      </span>
                      <span className="leg-discount">
                        -{leg.discount}%
                      </span>
                    </div>
                    <div className="leg-details">
                      <p>
                        <strong>{leg.jetName}</strong> • {leg.jetType} •{" "}
                        {leg.seats} Sitze
                      </p>
                      <p className="leg-reason">{leg.reason}</p>
                    </div>
                    <div className="leg-pricing">
                      <span className="old-price">
                        €{leg.normalPrice.toLocaleString()}
                      </span>
                      <span className="new-price">
                        €{leg.discountedPrice.toLocaleString()}
                      </span>
                    </div>
                    <div className="leg-countdown">
                      ⏰ Noch {hoursLeft}h {minutesLeft}min verfügbar
                    </div>
                    <button
                      className="confirm book-leg-btn"
                      onClick={() => {
                        setSelectedEmptyLeg(leg);
                        setShowHotDeals(false);
                        setFormData((prev) => ({
                          ...prev,
                          passengers: 1,
                          name: profile
                            ? profile.full_name || profile.company_name
                            : "",
                          email: profile ? profile.email : "",
                          phone: "",
                        }));
                      }}
                    >
                      Jetzt buchen
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              className="cancel"
              onClick={() => setShowHotDeals(false)}
            >
              Schließen
            </button>
          </div>
        </div>
      )}

      {/* Empty Leg Booking Modal */}
      {selectedEmptyLeg && (
        <div className="booking-modal">
          <div className="booking-content">
            <div className="hot-deal-badge">🔥 HOT DEAL</div>
            <h3>
              {selectedEmptyLeg.from} → {selectedEmptyLeg.to}
            </h3>
            <p className="jet-type">
              {selectedEmptyLeg.jetName} •{" "}
              {selectedEmptyLeg.jetType}
            </p>
            <div className="route-summary">
              <p>
                ✈️ Distanz:{" "}
                <strong>
                  {selectedEmptyLeg.from} → {selectedEmptyLeg.to}
                </strong>
              </p>
              <p>
                👥 Sitze: <strong>{selectedEmptyLeg.seats}</strong>
              </p>
              <p className="price-comparison">
                <span className="old-price-large">
                  €
                  {selectedEmptyLeg.normalPrice.toLocaleString()}
                </span>
                <span className="new-price-large">
                  €
                  {selectedEmptyLeg.discountedPrice.toLocaleString()}
                </span>
              </p>
              <p className="discount-badge">
                ✨ Sie sparen {selectedEmptyLeg.discount}%!
              </p>
            </div>
            {error && <div className="error-message">⚠️ {error}</div>}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                setError(null);

                if (!isAuthenticated) {
                  showToast(
                    "Bitte zuerst anmelden, um anzufragen.",
                    "error"
                  );
                  setShowLogin(true);
                  setLoading(false);
                  return;
                }

                const bookingData = {
                  from_location: selectedEmptyLeg.from,
                  to_location: selectedEmptyLeg.to,
                  from_iata: selectedEmptyLeg.fromIATA,
                  to_iata: selectedEmptyLeg.toIATA,
                  departure_date: new Date().toISOString(),
                  total_price: selectedEmptyLeg.discountedPrice,
                  status: "pending",
                  customer_name: formData.name,
                  customer_email: formData.email,
                  customer_phone: formData.phone,
                  jet_name: selectedEmptyLeg.jetName,
                  jet_type: selectedEmptyLeg.jetType,
                  passengers: formData.passengers,
                  jet_id: selectedEmptyLeg.jetId,
                  company_id:
                    jets.find((j) => j.id === selectedEmptyLeg.jetId)
                      ?.company_id || null,
                };

                try {
                  const { data: bookingEntry, error: dbError } =
                    await supabase
                      .from("bookings")
                      .insert(bookingData)
                      .select()
                      .single();
                  if (dbError) throw dbError;

                  const { error: jetUpdateError } = await supabase
                    .from("jets")
                    .update({ status: "wartung" })
                    .eq("id", selectedEmptyLeg.jetId);
                  if (jetUpdateError)
                    console.error(
                      "Fehler beim Reservieren des Jets (Hot Deal):",
                      jetUpdateError
                    );

                  const { error: legUpdateError } = await supabase
                    .from("empty_legs")
                    .update({ is_active: false })
                    .eq("id", selectedEmptyLeg.id);
                  if (legUpdateError)
                    console.error(
                      "Fehler beim Deaktivieren des Hot Deals:",
                      legUpdateError
                    );

                  showToast(
                    `✅ Hot Deal angefragt! ${selectedEmptyLeg.from} → ${selectedEmptyLeg.to}`,
                    "success"
                  );
                  setSelectedEmptyLeg(null);
                  setFormData((prev) => ({
                    ...prev,
                    from: "",
                    to: "",
                    dateTime: getDefaultDateTime(4),
                    returnDate: "",
                    roundtrip: false,
                    passengers: 1,
                  }));
                } catch (err) {
                  console.error("Empty Leg Buchung Fehler:", err);
                  showToast(`❌ Fehler: ${err.message}`, "error");
                } finally {
                  setLoading(false);
                }
              }}
            >
              <label htmlFor="leg-name">Dein Name</label>
              <input
                id="leg-name"
                type="text"
                name="name"
                placeholder="Dein Name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isAuthenticated}
              />

              <label htmlFor="leg-email">E-Mail-Adresse</label>
              <input
                id="leg-email"
                type="email"
                name="email"
                placeholder="E-Mail-Adresse"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isAuthenticated}
              />

              <label htmlFor="leg-phone">Telefon (Optional)</label>
              <input
                id="leg-phone"
                type="tel"
                name="phone"
                placeholder="Für schnelle Rückfragen"
                value={formData.phone}
                onChange={handleChange}
              />

              <label htmlFor="leg-passengers">
                Anzahl Passagiere
              </label>
              <select
                id="leg-passengers"
                name="passengers"
                value={formData.passengers}
                onChange={handleChange}
                required
              >
                {[...Array(selectedEmptyLeg.seats || 8)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} {i === 0 ? "Passagier" : "Passagiere"}
                  </option>
                ))}
              </select>

              <div className="buttons">
                <button
                  type="submit"
                  className="confirm"
                  disabled={loading}
                >
                  {loading
                    ? "Wird gesendet..."
                    : "Hot Deal anfragen"}
                </button>
                <button
                  type="button"
                  className="cancel"
                  onClick={() => {
                    setSelectedEmptyLeg(null);
                    setError(null);
                  }}
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />

      {/* Auth Modals */}
      {showLogin && (
        <Login
          onClose={() => setShowLogin(false)}
          onSwitchToSignup={() => {
            setShowLogin(false);
            setShowSignup(true);
          }}
        />
      )}
      {showSignup && (
        <Signup
          onClose={() => setShowSignup(false)}
          onSwitchToLogin={() => {
            setShowSignup(false);
            setShowLogin(true);
          }}
        />
      )}
    </div>
  );
}

// src/lib/routes.js

// Standard: lokal läuft die App unter "/"
// In Production (jetopti.com) kannst du VITE_MAP_ROUTE="/map" setzen
export const MAP_ROUTE = import.meta.env.VITE_MAP_ROUTE || '/';

// supabase/functions/_shared/cors.ts
// Standard-Header, damit der Browser die Funktion aufrufen darf

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
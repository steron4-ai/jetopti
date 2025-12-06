// supabase/functions/sign-charter-agreement/index.ts
// ✅ Charterfirma unterzeichnet Provisionsvertrag

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log('sign-charter-agreement function started');

interface SignAgreementRequest {
  agreement_type: 'bronze' | 'silver' | 'gold';
  terms_accepted: boolean;
  payout_method?: 'bank_transfer' | 'paypal' | 'stripe';
  payout_details?: any;
}

// Commission Rates
const COMMISSION_RATES: Record<'bronze' | 'silver' | 'gold', number> = {
  bronze: 6.0, // 6 %
  silver: 8.0, // 8 %
  gold: 12.0,  // 12 %
};

serve(async (req) => {
  // CORS-Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers':
          'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // -----------------------------
    // 1. Auth check
    // -----------------------------
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Nicht authentifiziert');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Auth Error:', userError);
      throw new Error('Nicht authentifiziert');
    }

    // -----------------------------
    // 2. Request-Body & Validierung
    // -----------------------------
    const body = (await req.json()) as SignAgreementRequest;
    console.log('📦 Sign Agreement Request:', body);

    if (
      !body.agreement_type ||
      !['bronze', 'silver', 'gold'].includes(body.agreement_type)
    ) {
      throw new Error('Ungültiger Agreement-Type');
    }

    if (!body.terms_accepted) {
      throw new Error('Nutzungsbedingungen müssen akzeptiert werden');
    }

    // -----------------------------
    // 3. Prüfen, ob schon aktiver Vertrag existiert
    // -----------------------------
    const { data: existingAgreement } = await supabase
      .from('charter_agreements')
      .select('id, status')
      .eq('company_id', user.id)
      .eq('status', 'active')
      .single();

    if (existingAgreement) {
      throw new Error(
        'Es existiert bereits ein aktiver Vertrag. Bitte kontaktieren Sie den Support für Änderungen.'
      );
    }

    // -----------------------------
    // 4. Commission Rate & Client-Info
    // -----------------------------
    const commission_rate = COMMISSION_RATES[body.agreement_type];

    // ⚠️ Wichtig: ip_address ist INET → nur EINE IP
    const rawIp =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      req.headers.get('cf-connecting-ip') ||
      null;

    // nur erste IP vor erstem Komma verwenden
    const ip_address = rawIp ? rawIp.split(',')[0].trim() : null;
    const user_agent = req.headers.get('user-agent') || null;

    const now = new Date();
    const todayIsoDate = now.toISOString().split('T')[0];

    // -----------------------------
    // 5. Agreement anlegen
    // -----------------------------
    const { data: agreement, error: agreementError } = await supabase
  .from('charter_agreements')
  .insert({
    company_id: user.id,
    agreement_type: body.agreement_type,
    commission_rate,
    status: 'active',
    signed_at: now.toISOString(),
    effective_from: todayIsoDate,
    terms_version: '1.0',
    terms_accepted: true,
    // ip_address komplett weglassen oder explizit null:
    ip_address: null,
    user_agent: req.headers.get('user-agent') || null,
    auto_payout: false,
    payout_method: body.payout_method ?? null,
    payout_details: body.payout_details ?? null,
  })
  .select()
  .single();


    if (agreementError || !agreement) {
      console.error('❌ Agreement Error:', agreementError);
      throw new Error(
        `Vertrag konnte nicht erstellt werden: ${
          agreementError?.message ?? 'Unbekannter Fehler'
        }`
      );
    }

    console.log('✅ Agreement signed:', agreement.id);

    // Optional: Welcome-Mail etc.
    // await sendWelcomeEmail(user.email, agreement);

    // -----------------------------
    // 6. Erfolgs-Response
    // -----------------------------
    return new Response(
      JSON.stringify({
        ok: true,
        agreement: {
          id: agreement.id,
          type: agreement.agreement_type,
          commission_rate: agreement.commission_rate,
          signed_at: agreement.signed_at,
          status: agreement.status,
        },
        message: 'Vertrag erfolgreich unterzeichnet! 🎉',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    console.error('❌ Sign Agreement Error:', error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: error?.message ?? 'Interner Fehler',
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});

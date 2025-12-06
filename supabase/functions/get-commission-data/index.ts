// supabase/functions/get-commission-data/index.ts
// ✅ Hole Provisions-Daten für Dashboard

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log('get-commission-data function started');

interface CommissionDataRequest {
  month?: string; // Optional: YYYY-MM format
  year?: number;  // Optional: Jahr
}

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Keine Authentifizierung');
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

    // Get user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('Nicht authentifiziert');
    }

    // Parse request (optional body)
    let body: CommissionDataRequest = {};
    if (req.method === 'POST') {
      body = await req.json();
    }

    console.log('📦 Commission Data Request:', body);

    // 1. HOLE AKTIVEN VERTRAG
    const { data: agreement, error: agreementError } = await supabase
      .from('charter_agreements')
      .select('*')
      .eq('company_id', user.id)
      .eq('status', 'active')
      .single();

    if (agreementError || !agreement) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Kein aktiver Vertrag gefunden',
          hasAgreement: false,
        }),
        {
          status: 200, // Kein Error, nur Info
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    console.log('✅ Agreement gefunden:', agreement.agreement_type, agreement.commission_rate + '%');

    // 2. AKTUELLER MONAT (laufend)
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const { data: currentTransactions, error: currentError } = await supabase
      .from('commission_transactions')
      .select(`
        *,
        bookings (
          id,
          customer_name,
          from_iata,
          to_iata,
          departure_date
        )
      `)
      .eq('company_id', user.id)
      .gte('created_at', currentMonthStart)
      .lte('created_at', currentMonthEnd)
      .order('created_at', { ascending: false });

    const currentStats = {
      month: currentMonth,
      total_bookings: currentTransactions?.length || 0,
      total_revenue: currentTransactions?.reduce((sum, t) => sum + Number(t.charter_price), 0) || 0,
      total_commission: currentTransactions?.reduce((sum, t) => sum + Number(t.commission_amount), 0) || 0,
      pending_count: currentTransactions?.filter(t => t.status === 'pending').length || 0,
      paid_count: currentTransactions?.filter(t => t.status === 'paid').length || 0,
      status: 'running',
      transactions: currentTransactions || [],
    };

    console.log(`📊 Aktueller Monat: ${currentStats.total_bookings} Buchungen, ${currentStats.total_commission}€ Provision`);

    // 3. VERGANGENE MONTHLY STATEMENTS
    const { data: statements, error: statementsError } = await supabase
      .from('monthly_statements')
      .select('*')
      .eq('company_id', user.id)
      .order('month', { ascending: false })
      .limit(12); // Letzte 12 Monate

    console.log(`📋 ${statements?.length || 0} vergangene Statements gefunden`);

    // 4. JAHRES-STATISTIK
    const currentYear = body.year || now.getFullYear();
    const yearStart = new Date(currentYear, 0, 1).toISOString();
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59).toISOString();

    const { data: yearTransactions } = await supabase
      .from('commission_transactions')
      .select('charter_price, commission_amount')
      .eq('company_id', user.id)
      .gte('created_at', yearStart)
      .lte('created_at', yearEnd);

    const yearStats = {
      year: currentYear,
      total_bookings: yearTransactions?.length || 0,
      total_revenue: yearTransactions?.reduce((sum, t) => sum + Number(t.charter_price), 0) || 0,
      total_commission: yearTransactions?.reduce((sum, t) => sum + Number(t.commission_amount), 0) || 0,
    };

    console.log(`📅 Jahr ${currentYear}: ${yearStats.total_bookings} Buchungen, ${yearStats.total_commission}€ Provision`);

    // 5. RÜCKGABE
    return new Response(
      JSON.stringify({
        ok: true,
        hasAgreement: true,
        
        // Vertrag
        agreement: {
          id: agreement.id,
          type: agreement.agreement_type,
          commission_rate: agreement.commission_rate,
          signed_at: agreement.signed_at,
          status: agreement.status,
        },
        
        // Aktueller Monat
        currentMonth: currentStats,
        
        // Vergangene Monate
        pastStatements: statements || [],
        
        // Jahres-Stats
        yearStats,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    console.error('❌ Commission Data Error:', error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: error.message || 'Interner Fehler',
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

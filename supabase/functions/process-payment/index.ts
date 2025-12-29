import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  reservation_id: string;
  reservation_type: 'jardin' | 'resto';
  amount: number;
  payment_method: 'dahabia' | 'cib';
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: PaymentRequest = await req.json();
    const { reservation_id, reservation_type, amount, payment_method, customer_name, customer_phone, customer_email } = payload;

    console.log(`Processing ${payment_method} payment for ${reservation_type} reservation ${reservation_id}`);
    console.log(`Amount: ${amount} DA, Customer: ${customer_name}`);

    // Get API keys from secrets
    const DAHABIA_API_KEY = Deno.env.get('DAHABIA_API_KEY');
    const DAHABIA_API_SECRET = Deno.env.get('DAHABIA_API_SECRET');
    const CIB_API_KEY = Deno.env.get('CIB_API_KEY');
    const CIB_API_SECRET = Deno.env.get('CIB_API_SECRET');

    // Check if API keys are configured
    if (payment_method === 'dahabia' && (!DAHABIA_API_KEY || !DAHABIA_API_SECRET)) {
      console.log('Dahabia API keys not configured yet');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Paiement Dahabia non configuré. Contactez l\'administrateur.',
          code: 'API_NOT_CONFIGURED'
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (payment_method === 'cib' && (!CIB_API_KEY || !CIB_API_SECRET)) {
      console.log('CIB API keys not configured yet');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Paiement CIB non configuré. Contactez l\'administrateur.',
          code: 'API_NOT_CONFIGURED'
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // TODO: INTEGRATE ACTUAL PAYMENT API HERE
    // ============================================
    // When you have the API keys, replace this section with actual API calls
    //
    // For Dahabia:
    // const dahabiaResponse = await fetch('https://api.dahabia.dz/v1/payments', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${DAHABIA_API_KEY}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     amount: amount,
    //     currency: 'DZD',
    //     customer_phone: customer_phone,
    //     reference: reservation_id,
    //     callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-webhook`
    //   })
    // });
    //
    // For CIB:
    // const cibResponse = await fetch('https://api.cib.dz/v1/payments', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${CIB_API_KEY}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     amount: amount,
    //     currency: 'DZD',
    //     customer_email: customer_email,
    //     reference: reservation_id
    //   })
    // });
    // ============================================

    // Generate unique confirmation code
    const confirmationCode = `GP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // For now, return a payment URL placeholder (to be replaced with actual API response)
    const paymentData = {
      success: true,
      payment_id: `PAY-${Date.now()}`,
      confirmation_code: confirmationCode,
      payment_method: payment_method,
      amount: amount,
      status: 'pending', // Will be 'completed' after webhook confirmation
      // This URL will be replaced by actual payment gateway URL
      payment_url: null, // API will return actual payment URL
      message: 'Système de paiement en cours de configuration. Veuillez patienter.'
    };

    console.log(`Payment initiated: ${paymentData.payment_id}`);

    return new Response(
      JSON.stringify(paymentData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Payment error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

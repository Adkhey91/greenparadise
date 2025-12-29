import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload = await req.json();
    console.log('Payment webhook received:', JSON.stringify(payload));

    // ============================================
    // TODO: VALIDATE WEBHOOK SIGNATURE
    // ============================================
    // Verify the webhook is from the actual payment provider
    // const signature = req.headers.get('x-payment-signature');
    // const isValid = verifySignature(payload, signature, WEBHOOK_SECRET);
    // if (!isValid) {
    //   return new Response('Invalid signature', { status: 401 });
    // }
    // ============================================

    const { 
      payment_id, 
      reservation_id, 
      reservation_type,
      status,
      transaction_id,
      payment_method
    } = payload;

    if (status === 'completed' || status === 'success') {
      console.log(`Payment ${payment_id} completed for reservation ${reservation_id}`);

      // Update reservation status based on type
      if (reservation_type === 'jardin') {
        const { error } = await supabase
          .from('reservations')
          .update({ 
            statut: 'confirmee',
            // Store payment info in message field for now
            message: `Paiement ${payment_method} confirmé - Transaction: ${transaction_id || payment_id}`
          })
          .eq('id', reservation_id);

        if (error) {
          console.error('Error updating jardin reservation:', error);
          throw error;
        }
      } else if (reservation_type === 'resto') {
        const { error } = await supabase
          .from('resto_reservations')
          .update({ 
            statut: 'confirmee',
            mode_paiement: payment_method,
            notes: `Transaction: ${transaction_id || payment_id}`
          })
          .eq('id', reservation_id);

        if (error) {
          console.error('Error updating resto reservation:', error);
          throw error;
        }

        // Also update table status to reserved
        const { data: reservation } = await supabase
          .from('resto_reservations')
          .select('table_id')
          .eq('id', reservation_id)
          .single();

        if (reservation?.table_id) {
          await supabase
            .from('resto_tables')
            .update({ statut: 'reservee' })
            .eq('id', reservation.table_id);
        }
      }

      console.log(`Reservation ${reservation_id} marked as confirmed`);

      // TODO: Send SMS confirmation to customer
      // await supabase.functions.invoke('send-sms', {
      //   body: { phone, message: `Votre réservation est confirmée. Code: ${confirmation_code}` }
      // });
    } else if (status === 'failed' || status === 'cancelled') {
      console.log(`Payment ${payment_id} failed/cancelled`);
      
      // Mark reservation as cancelled
      const table = reservation_type === 'jardin' ? 'reservations' : 'resto_reservations';
      await supabase.from(table).update({ statut: 'annulee' }).eq('id', reservation_id);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

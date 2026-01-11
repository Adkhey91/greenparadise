import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const normalizePhone = (value: string) => value.replace(/\D/g, "");

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const reservationNumber = typeof body?.reservationNumber === "string" ? body.reservationNumber.trim().toUpperCase() : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";

    if (!token && !(reservationNumber && phone)) {
      return new Response(
        JSON.stringify({ error: "missing_params" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("ticket-lookup", {
      hasToken: Boolean(token),
      reservationNumber: reservationNumber || undefined,
    });

    let reservation: any = null;

    if (token) {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("secure_token", token)
        .maybeSingle();

      if (error) {
        console.error("Lookup by token error:", error);
        return new Response(
          JSON.stringify({ error: "lookup_failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      reservation = data;
    } else {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("reservation_number", reservationNumber)
        .maybeSingle();

      if (error) {
        console.error("Lookup by number error:", error);
        return new Response(
          JSON.stringify({ error: "lookup_failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (data) {
        const dbLast8 = normalizePhone(data.telephone).slice(-8);
        const inputLast8 = normalizePhone(phone).slice(-8);
        if (dbLast8 && inputLast8 && dbLast8 === inputLast8) {
          reservation = data;
        }
      }
    }

    if (!reservation) {
      return new Response(
        JSON.stringify({ error: "not_found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback table label if snapshot is missing but table_id exists
    let tableLabel: string | null = reservation.table_number_snapshot ?? null;

    if (!tableLabel && reservation.table_id) {
      const { data: tableData } = await supabase
        .from("park_tables")
        .select("nom_ou_numero")
        .eq("id", reservation.table_id)
        .maybeSingle();

      tableLabel = tableData?.nom_ou_numero ?? null;
    }

    return new Response(
      JSON.stringify({ reservation: { ...reservation, table_label: tableLabel } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("ticket-lookup error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "server_error", message: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

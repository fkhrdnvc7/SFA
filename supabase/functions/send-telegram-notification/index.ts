import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { chat_id, message } = await req.json();

    if (!chat_id || !message) {
      return new Response(
        JSON.stringify({ error: "chat_id and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get bot token from settings
    const { data: settings, error: settingsError } = await supabase
      .from("telegram_settings")
      .select("bot_token")
      .eq("is_active", true)
      .single();

    if (settingsError || !settings?.bot_token) {
      return new Response(
        JSON.stringify({ error: "Telegram bot not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send message via Telegram API
    const response = await fetch(
      `https://api.telegram.org/bot${settings.bot_token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chat_id,
          text: message,
          parse_mode: "HTML",
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Telegram API error:", result);
      return new Response(
        JSON.stringify({ error: "Failed to send Telegram message", details: result }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

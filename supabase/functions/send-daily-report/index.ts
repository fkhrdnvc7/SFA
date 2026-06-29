import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: settings, error: settingsError } = await supabase
      .from("telegram_settings")
      .select("*")
      .eq("is_active", true)
      .single();

    if (settingsError || !settings) {
      return new Response(
        JSON.stringify({
          error: "No active Telegram settings found",
          details: settingsError?.message
        }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const report = await generateFullDailyReport(supabase);

    const response = await fetch(
      `https://api.telegram.org/bot${settings.bot_token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: settings.admin_chat_id,
          text: report,
          parse_mode: "HTML",
        }),
      },
    );

    const telegramResult = await response.json();

    if (response.ok) {
      await supabase.from("notifications").insert({
        title: "Telegram hisobot yuborildi",
        body: "Kunlik hisobot administratorga Telegram orqali yuborildi",
        type: "success",
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Report sent successfully"
        }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        error: "Failed to send report to Telegram",
        details: telegramResult
      }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in send-daily-report:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function generateFullDailyReport(
  supabase: ReturnType<typeof createClient>,
): Promise<string> {
  const today = new Date().toISOString().split("T")[0];

  const { data: incomingJobs, error: jobsError } = await supabase
    .from("incoming_jobs")
    .select("*, employers(name)")
    .eq("date", today);

  if (jobsError) {
    console.error("Error fetching incoming jobs:", jobsError);
  }

  const { data: payments, error: paymentsError } = await supabase
    .from("employer_transactions")
    .select("*, employers(name)")
    .eq("transaction_type", "payment")
    .eq("transaction_date", today);

  if (paymentsError) {
    console.error("Error fetching payments:", paymentsError);
  }

  const { data: allDebts, error: debtsError } = await supabase
    .from("employer_transactions")
    .select("transaction_type, total_amount");

  if (debtsError) {
    console.error("Error fetching debts:", debtsError);
  }

  const totalReceived =
    allDebts
      ?.filter((d) => d.transaction_type === "received")
      .reduce((s, d) => s + (Number(d.total_amount) || 0), 0) || 0;
  const totalPaid =
    allDebts
      ?.filter((d) => d.transaction_type === "payment")
      .reduce((s, d) => s + (Number(d.total_amount) || 0), 0) || 0;

  const dateStr = new Date().toLocaleDateString("uz-UZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let report = `🏭 <b>SFA TAILORING — KUNLIK HISOBOT</b>\n`;
  report += `📅 ${dateStr}\n`;
  report += `${"─".repeat(30)}\n\n`;

  report += `📥 <b>BUGUN KELGAN ISHLAR:</b>\n`;
  if (incomingJobs && incomingJobs.length > 0) {
    let qty = 0;
    let amt = 0;
    incomingJobs.forEach((j: Record<string, unknown>) => {
      const employers = j.employers as { name: string } | null;
      const quantity = (j.quantity as number) || 0;
      const clientPrice = (j.client_price_per_unit as number) || 0;
      qty += quantity;
      amt += quantity * clientPrice;
      report += `  • ${j.job_name} — ${quantity} dona`;
      if (employers) report += ` [${employers.name}]`;
      report += `\n`;
    });
    report += `  📌 Jami: ${qty} dona | ${amt.toLocaleString()} so'm\n\n`;
  } else {
    report += `  ➖ Bugun kelgan ish yo'q\n\n`;
  }

  report += `💸 <b>BUGUN AMALGA OSHIRILGAN TO'LOVLAR:</b>\n`;
  if (payments && payments.length > 0) {
    let total = 0;
    payments.forEach((p: Record<string, unknown>) => {
      const employers = p.employers as { name: string } | null;
      total += (p.total_amount as number) || 0;
      report += `  • ${employers?.name}: ${((p.total_amount as number) || 0).toLocaleString()} so'm\n`;
    });
    report += `  📌 Jami: ${total.toLocaleString()} so'm\n\n`;
  } else {
    report += `  ➖ Bugun to'lov yo'q\n\n`;
  }

  report += `${"─".repeat(30)}\n`;
  report += `📊 <b>UMUMIY BALANS:</b>\n`;
  report += `  Jami qabul qilingan: ${totalReceived.toLocaleString()} so'm\n`;
  report += `  Jami to'langan: ${totalPaid.toLocaleString()} so'm\n`;
  report += `  Qolgan qarz: <b>${(totalReceived - totalPaid).toLocaleString()} so'm</b>\n\n`;

  report += `🤖 <i>Avtomatik hisobot — SFA Tailoring</i>`;
  return report;
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const body = await req.json();
  const message = body?.message;

  if (!message) {
    return new Response("OK", { headers: corsHeaders });
  }

  const chatId = message.chat.id.toString();
  const text = message.text || "";

  const { data: settings } = await supabase
    .from("telegram_settings")
    .select("*")
    .eq("is_active", true)
    .single();

  if (!settings) {
    return new Response("No active settings", { headers: corsHeaders });
  }

  const BOT_TOKEN = settings.bot_token;

  async function sendMessage(chatId: string, text: string) {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    });
  }

  if (text === "/start") {
    await sendMessage(
      chatId,
      `<b>🏭 SFA Tailoring Bot</b>\n\n` +
        `Xush kelibsiz! Quyidagi komandalar mavjud:\n\n` +
        `/hisobot — Bugungi hisobotni ko'rish\n` +
        `/statistika — Umumiy statistika\n` +
        `/qarzlar — Ish beruvchilar qarzlari\n`,
    );
  } else if (text === "/hisobot") {
    const report = await generateDailyReport(supabase);
    await sendMessage(chatId, report);
  } else if (text === "/statistika") {
    const stats = await generateStatsReport(supabase);
    await sendMessage(chatId, stats);
  } else if (text === "/qarzlar") {
    const debts = await generateDebtReport(supabase);
    await sendMessage(chatId, debts);
  }

  return new Response("OK", { headers: corsHeaders });
});

async function generateDailyReport(supabase: ReturnType<typeof createClient>): Promise<string> {
  const today = new Date().toISOString().split("T")[0];

  const { data: incomingJobs } = await supabase
    .from("incoming_jobs")
    .select("*, employers(name)")
    .eq("date", today);

  const { data: payments } = await supabase
    .from("employer_transactions")
    .select("*, employers(name)")
    .eq("transaction_type", "payment")
    .eq("transaction_date", today);

  const { data: payrolls } = await supabase
    .from("payroll_records")
    .select("*, profiles(full_name)")
    .gte("payment_date", today + "T00:00:00")
    .lte("payment_date", today + "T23:59:59");

  const date = new Date().toLocaleDateString("uz-UZ");
  let report = `📊 <b>KUNLIK HISOBOT</b>\n`;
  report += `📅 Sana: ${date}\n\n`;

  report += `📥 <b>KELGAN ISHLAR:</b>\n`;
  if (incomingJobs && incomingJobs.length > 0) {
    let totalQuantity = 0;
    let totalAmount = 0;
    incomingJobs.forEach((job: Record<string, unknown>) => {
      const employers = job.employers as { name: string } | null;
      const quantity = (job.quantity as number) || 0;
      const clientPrice = (job.client_price_per_unit as number) || 0;
      const amount = quantity * clientPrice;
      totalQuantity += quantity;
      totalAmount += amount;
      report += `  • ${job.job_name}: ${quantity} dona`;
      if (employers) report += ` (${employers.name})`;
      report += `\n`;
    });
    report += `  <b>Jami: ${totalQuantity} dona | ${totalAmount.toLocaleString()} so'm</b>\n\n`;
  } else {
    report += `  Bugun kelgan ish yo'q\n\n`;
  }

  report += `💸 <b>AMALGA OSHIRILGAN TO'LOVLAR:</b>\n`;
  if (payments && payments.length > 0) {
    let totalPaid = 0;
    payments.forEach((p: Record<string, unknown>) => {
      const employers = p.employers as { name: string } | null;
      totalPaid += (p.total_amount as number) || 0;
      report += `  • ${employers?.name || "Noma'lum"}: ${((p.total_amount as number) || 0).toLocaleString()} so'm\n`;
    });
    report += `  <b>Jami: ${totalPaid.toLocaleString()} so'm</b>\n\n`;
  } else {
    report += `  Bugun to'lov amalga oshirilmagan\n\n`;
  }

  report += `👩‍🏭 <b>TIKUVCHI MAOSHLARI:</b>\n`;
  if (payrolls && payrolls.length > 0) {
    let totalPayroll = 0;
    payrolls.forEach((p: Record<string, unknown>) => {
      const profiles = p.profiles as { full_name: string } | null;
      totalPayroll += (p.paid_amount as number) || 0;
      report += `  • ${profiles?.full_name || "Noma'lum"}: ${((p.paid_amount as number) || 0).toLocaleString()} so'm\n`;
    });
    report += `  <b>Jami: ${totalPayroll.toLocaleString()} so'm</b>\n\n`;
  } else {
    report += `  Bugun maosh to'lanmagan\n\n`;
  }

  report += `🤖 <i>SFA Tailoring boshqaruv tizimi</i>`;
  return report;
}

async function generateStatsReport(supabase: ReturnType<typeof createClient>): Promise<string> {
  const { count: totalJobs } = await supabase
    .from("incoming_jobs")
    .select("*", { count: "exact", head: true });

  const { count: openJobs } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("status", "ochiq");

  const { data: debtData } = await supabase
    .from("employer_transactions")
    .select("transaction_type, total_amount");

  const totalReceived =
    debtData
      ?.filter((d) => d.transaction_type === "received")
      .reduce((sum, d) => sum + (Number(d.total_amount) || 0), 0) || 0;
  const totalPaid =
    debtData
      ?.filter((d) => d.transaction_type === "payment")
      .reduce((sum, d) => sum + (Number(d.total_amount) || 0), 0) || 0;

  let report = `📈 <b>UMUMIY STATISTIKA</b>\n\n`;
  report += `📦 Jami kelgan ishlar: <b>${totalJobs || 0} ta</b>\n`;
  report += `🔓 Ochiq ishlar: <b>${openJobs || 0} ta</b>\n\n`;
  report += `💰 Jami qabul qilingan: <b>${totalReceived.toLocaleString()} so'm</b>\n`;
  report += `✅ Jami to'langan: <b>${totalPaid.toLocaleString()} so'm</b>\n`;
  report += `⚠️ Qolgan qarz: <b>${(totalReceived - totalPaid).toLocaleString()} so'm</b>\n\n`;
  report += `🤖 <i>SFA Tailoring boshqaruv tizimi</i>`;
  return report;
}

async function generateDebtReport(supabase: ReturnType<typeof createClient>): Promise<string> {
  const { data: employers } = await supabase
    .from("employers")
    .select("id, name")
    .eq("is_active", true);

  let report = `⚠️ <b>ISH BERUVCHILAR QARZLARI</b>\n\n`;

  if (!employers || employers.length === 0) {
    return report + "Ish beruvchilar mavjud emas";
  }

  for (const employer of employers) {
    const { data: txns } = await supabase
      .from("employer_transactions")
      .select("transaction_type, total_amount")
      .eq("employer_id", employer.id);

    const received =
      txns
        ?.filter((t) => t.transaction_type === "received")
        .reduce((s, t) => s + (Number(t.total_amount) || 0), 0) || 0;
    const paid =
      txns
        ?.filter((t) => t.transaction_type === "payment")
        .reduce((s, t) => s + (Number(t.total_amount) || 0), 0) || 0;
    const debt = received - paid;

    if (debt > 0) {
      report += `👤 <b>${employer.name}</b>\n`;
      report += `   Olindi: ${received.toLocaleString()} so'm\n`;
      report += `   Berildi: ${paid.toLocaleString()} so'm\n`;
      report += `   Qarz: <b>${debt.toLocaleString()} so'm</b>\n\n`;
    }
  }

  report += `🤖 <i>SFA Tailoring boshqaruv tizimi</i>`;
  return report;
}

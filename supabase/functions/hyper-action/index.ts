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

  console.log("📨 Webhook request received");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let body;
  try {
    body = await req.json();
  } catch (e) {
    console.error("❌ Failed to parse body:", e);
    return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
  }

  console.log("📦 Body received:", JSON.stringify(body).substring(0, 200));

  const message = body?.message;
  const callbackQuery = body?.callback_query;

  const { data: settings } = await supabase
    .from("telegram_settings")
    .select("*")
    .eq("is_active", true)
    .single();

  if (!settings) {
    return new Response("No active settings", { headers: corsHeaders });
  }

  const BOT_TOKEN = settings.bot_token;

  async function sendMessage(chatId: string, text: string, replyMarkup?: any) {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        reply_markup: replyMarkup,
      }),
    });
  }

  async function editMessage(chatId: string, messageId: number, text: string, replyMarkup?: any) {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: "HTML",
        reply_markup: replyMarkup,
      }),
    });
  }

  // Get user profile by chat ID
  async function getUserProfile(chatId: string) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, role, telegram_chat_id")
      .eq("telegram_chat_id", chatId)
      .single();
    return profile;
  }

  // Generate keyboard based on user role
  function getMenuKeyboard(role?: string) {
    if (role === "SEAMSTRESS") {
      // Tikuvchi faqat o'z ishini ko'radi
      return {
        inline_keyboard: [
          [{ text: "👩‍🏭 Mening ishim", callback_data: "mening_ishim" }],
          [{ text: "📊 Bugungi hisobot", callback_data: "hisobot" }],
        ],
      };
    } else if (role === "MANAGER") {
      // Manager ko'proq funksiyalarni ko'radi
      return {
        inline_keyboard: [
          [
            { text: "📊 Bugungi hisobot", callback_data: "hisobot" },
            { text: "📈 Statistika", callback_data: "statistika" },
          ],
          [
            { text: "📦 Ochiq ishlar", callback_data: "ochiq_ishlar" },
            { text: "👥 Tikuvchilar", callback_data: "tikuvchilar" },
          ],
          [
            { text: "💰 Oylik maoshlar", callback_data: "oylik" },
            { text: "⚠️ Qarzlar", callback_data: "qarzlar" },
          ],
        ],
      };
    } else if (role === "ISH_BERUVCHI") {
      // Ish beruvchi o'z ishlarini ko'radi
      return {
        inline_keyboard: [
          [
            { text: "📊 Mening ishlarim", callback_data: "ish_beruvchi_ishlar" },
            { text: "💰 Moliyaviy hisobot", callback_data: "ish_beruvchi_moliya" },
          ],
        ],
      };
    } else {
      // ADMIN yoki noma'lum - barcha funksiyalar
      return {
        inline_keyboard: [
          [
            { text: "📊 Bugungi hisobot", callback_data: "hisobot" },
            { text: "📈 Statistika", callback_data: "statistika" },
          ],
          [
            { text: "⚠️ Qarzlar", callback_data: "qarzlar" },
            { text: "📦 Ochiq ishlar", callback_data: "ochiq_ishlar" },
          ],
          [
            { text: "👥 Tikuvchilar", callback_data: "tikuvchilar" },
            { text: "💰 Oylik maoshlar", callback_data: "oylik" },
          ],
          [
            { text: "🏭 Ish beruvchilar", callback_data: "ish_beruvchilar" },
            { text: "👩‍🏭 Tikuvchi statistika", callback_data: "tikuvchi_stats" },
          ],
        ],
      };
    }
  }

  // Back button with role awareness
  function getBackButton(role?: string) {
    return {
      inline_keyboard: [
        [{ text: "⬅️ Asosiy menyu", callback_data: "menu" }],
      ],
    };
  }

  // Handle text messages
  if (message) {
    const chatId = message.chat.id.toString();
    const text = message.text || "";
    console.log(`💬 Message from ${chatId}: "${text}"`);

    if (text === "/start" || text === "/menu") {
      console.log("🔑 Handling /start or /menu command");
      const profile = await getUserProfile(chatId);
      console.log("👤 Profile:", profile ? profile.full_name : "Not found");

      const keyboard = getMenuKeyboard(profile?.role);
      console.log("⌨️ Keyboard generated:", JSON.stringify(keyboard));

      let welcomeText = `<b>🏭 SFA Tailoring Bot</b>\n\n`;
      if (profile) {
        welcomeText += `Xush kelibsiz, <b>${profile.full_name}</b>!\n\n`;
        const roleNames: Record<string, string> = {
          "ADMIN": "Administrator",
          "MANAGER": "Menejer",
          "SEAMSTRESS": "Tikuvchi",
          "ISH_BERUVCHI": "Ish beruvchi"
        };
        welcomeText += `Sizning rolingingiz: ${roleNames[profile.role] || profile.role}\n\n`;
      } else {
        welcomeText += `Xush kelibsiz!\n\n`;
        welcomeText += `⚠️ Sizning akkauntingiz tizimga ulanmagan.\n`;
        welcomeText += `Chat ID: <code>${chatId}</code>\n\n`;
      }
      welcomeText += `Quyidagi bo'limlardan birini tanlang:`;

      console.log("📤 Sending message with keyboard...");
      await sendMessage(chatId, welcomeText, keyboard);
      console.log("✅ Message sent successfully");
    }
  }

  // Handle callback queries (button clicks)
  if (callbackQuery) {
    const chatId = callbackQuery.message.chat.id.toString();
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;

    // Answer callback query to remove loading state
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: callbackQuery.id,
      }),
    });

    const profile = await getUserProfile(chatId);
    const keyboard = getMenuKeyboard(profile?.role);
    const backButton = getBackButton(profile?.role);

    if (data === "menu") {
      let menuText = `<b>📋 Asosiy menyu</b>\n\n`;
      if (profile) {
        menuText += `${profile.full_name}\n\n`;
      }
      menuText += `Kerakli bo'limni tanlang:`;
      await editMessage(chatId, messageId, menuText, keyboard);
    } else if (data === "hisobot") {
      const report = await generateDailyReport(supabase);
      await editMessage(chatId, messageId, report, backButton);
    } else if (data === "statistika") {
      const stats = await generateStatsReport(supabase);
      await editMessage(chatId, messageId, stats, backButton);
    } else if (data === "qarzlar") {
      const debts = await generateDebtReport(supabase);
      await editMessage(chatId, messageId, debts, backButton);
    } else if (data === "mening_ishim") {
      const myWork = await generateSeamstressReport(supabase, chatId);
      await editMessage(chatId, messageId, myWork, backButton);
    } else if (data === "ochiq_ishlar") {
      const openJobs = await generateOpenJobsReport(supabase);
      await editMessage(chatId, messageId, openJobs, backButton);
    } else if (data === "tikuvchilar") {
      const seamstresses = await generateSeamstressList(supabase);
      await editMessage(chatId, messageId, seamstresses, backButton);
    } else if (data === "oylik") {
      const payroll = await generatePayrollReport(supabase);
      await editMessage(chatId, messageId, payroll, backButton);
    } else if (data === "ish_beruvchilar") {
      const employers = await generateEmployersList(supabase);
      await editMessage(chatId, messageId, employers, backButton);
    } else if (data === "tikuvchi_stats") {
      const stats = await generateAllSeamstressStats(supabase);
      await editMessage(chatId, messageId, stats, backButton);
    } else if (data === "ish_beruvchi_ishlar") {
      const jobs = await generateEmployerJobsReport(supabase, chatId);
      await editMessage(chatId, messageId, jobs, backButton);
    } else if (data === "ish_beruvchi_moliya") {
      const finance = await generateEmployerFinanceReport(supabase, chatId);
      await editMessage(chatId, messageId, finance, backButton);
    }
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
    report += "Ish beruvchilar mavjud emas\n\n";
    report += `🤖 <i>SFA Tailoring boshqaruv tizimi</i>`;
    return report;
  }

  let hasDebt = false;
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
      hasDebt = true;
      report += `👤 <b>${employer.name}</b>\n`;
      report += `   Olindi: ${received.toLocaleString()} so'm\n`;
      report += `   Berildi: ${paid.toLocaleString()} so'm\n`;
      report += `   Qarz: <b>${debt.toLocaleString()} so'm</b>\n\n`;
    }
  }

  if (!hasDebt) {
    report += "✅ Hozircha qarzlar yo'q\n\n";
  }

  report += `🤖 <i>SFA Tailoring boshqaruv tizimi</i>`;
  return report;
}

async function generateSeamstressReport(
  supabase: ReturnType<typeof createClient>,
  chatId: string
): Promise<string> {
  // Find user by telegram_chat_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("telegram_chat_id", chatId)
    .single();

  if (!profile) {
    return (
      `❌ <b>Akkaunt topilmadi</b>\n\n` +
      `Sizning Telegram akkauntingiz tizimga ulanmagan. ` +
      `Administrator bilan bog'laning va chat ID ni qo'shing.\n\n` +
      `Sizning Chat ID: <code>${chatId}</code>\n\n` +
      `🤖 <i>SFA Tailoring boshqaruv tizimi</i>`
    );
  }

  if (profile.role !== "SEAMSTRESS") {
    return (
      `⚠️ <b>Faqat tikuvchilar uchun</b>\n\n` +
      `Bu bo'lim faqat tikuvchilar uchun mo'ljallangan.\n\n` +
      `🤖 <i>SFA Tailoring boshqaruv tizimi</i>`
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  // Get all job items for this seamstress
  const { data: jobItems } = await supabase
    .from("job_items")
    .select(`
      id,
      quantity,
      unit_price,
      bonus_amount,
      created_at,
      job_id,
      operation_id,
      jobs(job_name, status),
      operations(name)
    `)
    .eq("seamstress_id", profile.id)
    .order("created_at", { ascending: false });

  if (!jobItems || jobItems.length === 0) {
    return (
      `👩‍🏭 <b>MENING ISHLARIM</b>\n\n` +
      `Salom, ${profile.full_name}!\n\n` +
      `Hozircha sizga biriktirilgan ish mavjud emas.\n\n` +
      `🤖 <i>SFA Tailoring boshqaruv tizimi</i>`
    );
  }

  // Calculate today's work
  const todayItems = jobItems.filter((item) =>
    item.created_at.startsWith(today)
  );
  const todayQuantity = todayItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const todayEarnings = todayItems.reduce(
    (sum, item) =>
      sum + (item.quantity || 0) * (item.unit_price || 0) + (item.bonus_amount || 0),
    0
  );

  // Calculate this month's work
  const monthItems = jobItems.filter((item) =>
    item.created_at.startsWith(thisMonth)
  );
  const monthQuantity = monthItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const monthEarnings = monthItems.reduce(
    (sum, item) =>
      sum + (item.quantity || 0) * (item.unit_price || 0) + (item.bonus_amount || 0),
    0
  );

  // Calculate all-time work
  const totalQuantity = jobItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalEarnings = jobItems.reduce(
    (sum, item) =>
      sum + (item.quantity || 0) * (item.unit_price || 0) + (item.bonus_amount || 0),
    0
  );

  let report = `👩‍🏭 <b>MENING ISHLARIM</b>\n\n`;
  report += `Salom, <b>${profile.full_name}</b>!\n\n`;

  report += `📊 <b>BUGUNGI ISH:</b>\n`;
  if (todayQuantity > 0) {
    // Group by job
    const jobMap = new Map<string, { quantity: number; earnings: number }>();
    todayItems.forEach((item) => {
      const jobName = (item.jobs as any)?.job_name || "Noma'lum ish";
      const existing = jobMap.get(jobName) || { quantity: 0, earnings: 0 };
      existing.quantity += item.quantity || 0;
      existing.earnings +=
        (item.quantity || 0) * (item.unit_price || 0) + (item.bonus_amount || 0);
      jobMap.set(jobName, existing);
    });

    jobMap.forEach((data, jobName) => {
      report += `  • ${jobName}: ${data.quantity} dona | ${data.earnings.toLocaleString()} so'm\n`;
    });
    report += `  <b>Jami: ${todayQuantity} dona | ${todayEarnings.toLocaleString()} so'm</b>\n\n`;
  } else {
    report += `  Bugun ish bajarilmagan\n\n`;
  }

  report += `📅 <b>SHU OYDA:</b>\n`;
  report += `  Jami: <b>${monthQuantity} dona | ${monthEarnings.toLocaleString()} so'm</b>\n\n`;

  report += `💰 <b>UMUMIY DAROMAD:</b>\n`;
  report += `  Jami: <b>${totalQuantity} dona | ${totalEarnings.toLocaleString()} so'm</b>\n\n`;

  report += `🤖 <i>SFA Tailoring boshqaruv tizimi</i>`;
  return report;
}

async function generateOpenJobsReport(supabase: ReturnType<typeof createClient>): Promise<string> {
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, job_name, created_at, total_estimated_amount, profiles(full_name)")
    .eq("status", "ochiq")
    .order("created_at", { ascending: false })
    .limit(10);

  let report = `📦 <b>OCHIQ ISHLAR</b>\n\n`;

  if (!jobs || jobs.length === 0) {
    report += "Hozirda ochiq ishlar yo'q\n\n";
  } else {
    jobs.forEach((job: any, index: number) => {
      report += `${index + 1}. <b>${job.job_name}</b>\n`;
      report += `   Yaratuvchi: ${job.profiles?.full_name || "Noma'lum"}\n`;
      report += `   Summa: ${(job.total_estimated_amount || 0).toLocaleString()} so'm\n`;
      report += `   Sana: ${new Date(job.created_at).toLocaleDateString("uz-UZ")}\n\n`;
    });
  }

  report += `🤖 <i>SFA Tailoring boshqaruv tizimi</i>`;
  return report;
}

async function generateSeamstressList(supabase: ReturnType<typeof createClient>): Promise<string> {
  const { data: seamstresses } = await supabase
    .from("profiles")
    .select("id, full_name, email, is_active, created_at")
    .eq("role", "SEAMSTRESS")
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  let report = `👥 <b>TIKUVCHILAR RO'YXATI</b>\n\n`;

  if (!seamstresses || seamstresses.length === 0) {
    report += "Hozirda faol tikuvchilar yo'q\n\n";
  } else {
    report += `Jami: <b>${seamstresses.length} kishi</b>\n\n`;
    seamstresses.forEach((s: any, index: number) => {
      report += `${index + 1}. ${s.full_name}\n`;
      report += `   Email: ${s.email}\n`;
      report += `   ✅ Faol\n\n`;
    });
  }

  report += `🤖 <i>SFA Tailoring boshqaruv tizimi</i>`;
  return report;
}

async function generatePayrollReport(supabase: ReturnType<typeof createClient>): Promise<string> {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const { data: payrolls } = await supabase
    .from("payroll_records")
    .select("*, profiles(full_name)")
    .eq("month", currentMonth)
    .eq("year", currentYear)
    .order("total_amount", { ascending: false });

  let report = `💰 <b>OYLIK MAOSHLAR</b>\n`;
  report += `📅 ${currentMonth}-oy, ${currentYear}-yil\n\n`;

  if (!payrolls || payrolls.length === 0) {
    report += "Ushbu oy uchun maosh ma'lumotlari yo'q\n\n";
  } else {
    let totalAmount = 0;
    let totalPaid = 0;

    payrolls.forEach((p: any, index: number) => {
      totalAmount += p.total_amount || 0;
      totalPaid += p.paid_amount || 0;

      const status = p.status === "tolangan" ? "✅" :
                     p.status === "qisman" ? "⚠️" : "❌";

      report += `${index + 1}. ${p.profiles?.full_name || "Noma'lum"} ${status}\n`;
      report += `   Jami: ${(p.total_amount || 0).toLocaleString()} so'm\n`;
      report += `   To'langan: ${(p.paid_amount || 0).toLocaleString()} so'm\n\n`;
    });

    report += `<b>JAMI:</b>\n`;
    report += `  Maosh: ${totalAmount.toLocaleString()} so'm\n`;
    report += `  To'langan: ${totalPaid.toLocaleString()} so'm\n`;
    report += `  Qoldi: ${(totalAmount - totalPaid).toLocaleString()} so'm\n\n`;
  }

  report += `🤖 <i>SFA Tailoring boshqaruv tizimi</i>`;
  return report;
}

async function generateEmployersList(supabase: ReturnType<typeof createClient>): Promise<string> {
  const { data: employers } = await supabase
    .from("employers")
    .select("id, name, company_name, phone, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true });

  let report = `🏭 <b>ISH BERUVCHILAR</b>\n\n`;

  if (!employers || employers.length === 0) {
    report += "Hozirda ish beruvchilar ro'yxati bo'sh\n\n";
  } else {
    report += `Jami: <b>${employers.length} ta</b>\n\n`;
    employers.forEach((e: any, index: number) => {
      report += `${index + 1}. <b>${e.company_name || e.name}</b>\n`;
      if (e.phone) report += `   ☎️ ${e.phone}\n`;
      report += `   ✅ Faol\n\n`;
    });
  }

  report += `🤖 <i>SFA Tailoring boshqaruv tizimi</i>`;
  return report;
}

async function generateAllSeamstressStats(supabase: ReturnType<typeof createClient>): Promise<string> {
  const today = new Date().toISOString().split("T")[0];
  const thisMonth = new Date().toISOString().slice(0, 7);

  const { data: seamstresses } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "SEAMSTRESS")
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  let report = `👥 <b>TIKUVCHILAR STATISTIKASI</b>\n\n`;

  if (!seamstresses || seamstresses.length === 0) {
    report += "Tikuvchilar mavjud emas\n\n";
    report += `🤖 <i>SFA Tailoring boshqaruv tizimi</i>`;
    return report;
  }

  let todayTotal = 0;
  let monthTotal = 0;

  for (const seamstress of seamstresses) {
    const { data: jobItems } = await supabase
      .from("job_items")
      .select("quantity, unit_price, bonus_amount, created_at")
      .eq("seamstress_id", seamstress.id);

    if (!jobItems || jobItems.length === 0) continue;

    const todayEarnings = jobItems
      .filter((item) => item.created_at.startsWith(today))
      .reduce((sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0) + (item.bonus_amount || 0), 0);

    const monthEarnings = jobItems
      .filter((item) => item.created_at.startsWith(thisMonth))
      .reduce((sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0) + (item.bonus_amount || 0), 0);

    todayTotal += todayEarnings;
    monthTotal += monthEarnings;

    if (monthEarnings > 0) {
      report += `👤 <b>${seamstress.full_name}</b>\n`;
      report += `   Bugun: ${todayEarnings.toLocaleString()} so'm\n`;
      report += `   Shu oyda: ${monthEarnings.toLocaleString()} so'm\n\n`;
    }
  }

  report += `<b>JAMI:</b>\n`;
  report += `  Bugun: ${todayTotal.toLocaleString()} so'm\n`;
  report += `  Shu oyda: ${monthTotal.toLocaleString()} so'm\n\n`;

  report += `🤖 <i>SFA Tailoring boshqaruv tizimi</i>`;
  return report;
}

async function generateEmployerJobsReport(
  supabase: ReturnType<typeof createClient>,
  chatId: string
): Promise<string> {
  // Find employer by telegram_chat_id via user
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("telegram_chat_id", chatId)
    .single();

  if (!profile) {
    return (
      `❌ <b>Akkaunt topilmadi</b>\n\n` +
      `Sizning Telegram akkauntingiz tizimga ulanmagan.\n\n` +
      `Chat ID: <code>${chatId}</code>\n\n` +
      `🤖 <i>SFA Tailoring boshqaruv tizimi</i>`
    );
  }

  const { data: employer } = await supabase
    .from("employers")
    .select("id, name, company_name")
    .eq("user_id", profile.id)
    .single();

  if (!employer) {
    return (
      `⚠️ <b>Ish beruvchi topilmadi</b>\n\n` +
      `Sizning profilingiz ish beruvchi bilan bog'lanmagan.\n\n` +
      `🤖 <i>SFA Tailoring boshqaruv tizimi</i>`
    );
  }

  const { data: jobs } = await supabase
    .from("incoming_jobs")
    .select("id, job_name, quantity, date, status, client_price_per_unit")
    .eq("employer_id", employer.id)
    .order("date", { ascending: false })
    .limit(10);

  let report = `📦 <b>MENING ISHLARIM</b>\n\n`;
  report += `Ish beruvchi: <b>${employer.company_name || employer.name}</b>\n\n`;

  if (!jobs || jobs.length === 0) {
    report += "Hozircha ishlar mavjud emas\n\n";
  } else {
    jobs.forEach((job: any, index: number) => {
      const amount = (job.quantity || 0) * (job.client_price_per_unit || 0);
      const statusIcon = job.status === "approved" ? "✅" :
                         job.status === "rejected" ? "❌" : "⏳";
      report += `${index + 1}. <b>${job.job_name}</b> ${statusIcon}\n`;
      report += `   Miqdor: ${job.quantity || 0} dona\n`;
      report += `   Summa: ${amount.toLocaleString()} so'm\n`;
      report += `   Sana: ${new Date(job.date).toLocaleDateString("uz-UZ")}\n\n`;
    });
  }

  report += `🤖 <i>SFA Tailoring boshqaruv tizimi</i>`;
  return report;
}

async function generateEmployerFinanceReport(
  supabase: ReturnType<typeof createClient>,
  chatId: string
): Promise<string> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("telegram_chat_id", chatId)
    .single();

  if (!profile) {
    return (
      `❌ <b>Akkaunt topilmadi</b>\n\n` +
      `Chat ID: <code>${chatId}</code>\n\n` +
      `🤖 <i>SFA Tailoring boshqaruv tizimi</i>`
    );
  }

  const { data: employer } = await supabase
    .from("employers")
    .select("id, name, company_name")
    .eq("user_id", profile.id)
    .single();

  if (!employer) {
    return (
      `⚠️ <b>Ish beruvchi topilmadi</b>\n\n` +
      `🤖 <i>SFA Tailoring boshqaruv tizimi</i>`
    );
  }

  const { data: transactions } = await supabase
    .from("employer_transactions")
    .select("transaction_type, total_amount, transaction_date")
    .eq("employer_id", employer.id)
    .order("transaction_date", { ascending: false });

  let report = `💰 <b>MOLIYAVIY HISOBOT</b>\n\n`;
  report += `Ish beruvchi: <b>${employer.company_name || employer.name}</b>\n\n`;

  if (!transactions || transactions.length === 0) {
    report += "Moliyaviy operatsiyalar mavjud emas\n\n";
  } else {
    const received = transactions
      .filter((t) => t.transaction_type === "received")
      .reduce((sum, t) => sum + (Number(t.total_amount) || 0), 0);

    const paid = transactions
      .filter((t) => t.transaction_type === "payment")
      .reduce((sum, t) => sum + (Number(t.total_amount) || 0), 0);

    const debt = received - paid;

    report += `📥 <b>Jami olindi:</b> ${received.toLocaleString()} so'm\n`;
    report += `💸 <b>Jami to'landi:</b> ${paid.toLocaleString()} so'm\n`;
    report += `⚠️ <b>Qarz:</b> ${debt.toLocaleString()} so'm\n\n`;

    report += `<b>So'nggi operatsiyalar:</b>\n\n`;
    transactions.slice(0, 5).forEach((t: any, index: number) => {
      const icon = t.transaction_type === "received" ? "📥" : "💸";
      const type = t.transaction_type === "received" ? "Olindi" : "To'landi";
      report += `${icon} ${type}: ${(t.total_amount || 0).toLocaleString()} so'm\n`;
      report += `   ${new Date(t.transaction_date).toLocaleDateString("uz-UZ")}\n\n`;
    });
  }

  report += `🤖 <i>SFA Tailoring boshqaruv tizimi</i>`;
  return report;
}

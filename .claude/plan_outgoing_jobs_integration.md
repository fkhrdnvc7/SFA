# Ketgan Ishlar Integratsiya Rejasi

## Maqsad
Admin/Manager ketgan ishlarni belgilashda:
1. Ish beruvchiga notification yuborish
2. Ish beruvchiga Telegram orqali xabar yuborish
3. Kelgan ishlarga ish qo'shganda Ishlar bo'limiga ham qo'shish
4. Hammasi ketgandan keyin Ishlarda o'sha ishni yopiq qilish

## Joriy Holat Tahlili

### Mavjud Strukturalar:
- **incoming_jobs** - Kelgan ishlar (employer_id, quantity)
- **outgoing_jobs** - Ketgan ishlar (incoming_job_id, quantity_sent, date)
- **jobs** - Ishxona ishlari (job_name, status: 'ochiq'|'yopiq')
- **employers** - Ish beruvchilar (name, company_name, user_id)
- **notifications** - Xabarnomalar (user_id opsional)
- **telegram_settings** - Telegram bot sozlamalari

### Mavjud Funksiyalar:
- `createNotification()` - Xabarnoma yaratish
- Telegram bot webhook va daily report funksiyalari mavjud

## Amalga Oshirish Rejasi

### 1. Kelgan Ish Qo'shishda Jobs'ga ham Qo'shish

**Fayl:** `src/pages/IncomingJobs.tsx`

**Qilinishi kerak:**
- `handleSubmit` funksiyasida yangi incoming_job yaratilganda:
  - Agar employer_id mavjud bo'lsa, jobs jadvaliga ham qo'shish
  - job_name ni incoming_job dan olish
  - status = 'ochiq' qilib yaratish
  - incoming_job_id ni jobs jadvaliga saqlab qo'yish (keyin yopish uchun)

**Muammo:** jobs jadvalida incoming_job_id yo'q

**Yechim:** Migration orqali jobs jadvaliga incoming_job_id ustuni qo'shish

### 2. Ketgan Ish Qo'shishda Notifications va Telegram

**Fayl:** `src/pages/OutgoingJobs.tsx`

**Qilinishi kerak `handleSubmit` da:**

1. **Outgoing job yaratish** (mavjud)
2. **Employer ma'lumotlarini olish** - incoming_job dan employer_id va employer.user_id
3. **Notification yaratish** - ISH_BERUVCHI user uchun
4. **Telegram xabar yuborish** - Edge Function orqali
5. **Agar hammasi ketgan bo'lsa** - Jobs'dagi tegishli ishni yopiq qilish

#### 2a. Telegram Xabar Yuborish

**Yangi Edge Function yaratish:** `supabase/functions/send-telegram-notification/index.ts`

**Funksiya vazifasi:**
- Parametrlar: employer_id, message
- telegram_settings dan bot_token olish
- employers jadvalidan employer ma'lumotlarini olish
- Agar employer.telegram_chat_id mavjud bo'lsa, xabar yuborish

**Muammo:** employers jadvalida telegram_chat_id yo'q

**Yechim:** Migration orqali employers jadvaliga telegram_chat_id ustuni qo'shish

#### 2b. Jobs'ni Yopiq Qilish

**Mantiq:**
- Outgoing job yaratilganda yoki tahrirlanganda
- incoming_job ning total quantity va total outgoing quantity ni solishtirish
- Agar total_outgoing >= total_incoming:
  - jobs jadvalidan incoming_job_id = ? bo'lgan ishni topish
  - status = 'yopiq' va completed_at = now() qilish

### 3. Database O'zgarishlar

#### Migration 1: jobs jadvaliga incoming_job_id qo'shish
```sql
ALTER TABLE public.jobs 
ADD COLUMN incoming_job_id UUID REFERENCES public.incoming_jobs(id) ON DELETE SET NULL;

CREATE INDEX idx_jobs_incoming_job_id ON public.jobs(incoming_job_id);
```

#### Migration 2: employers jadvaliga telegram_chat_id qo'shish
```sql
ALTER TABLE public.employers 
ADD COLUMN telegram_chat_id TEXT;

COMMENT ON COLUMN public.employers.telegram_chat_id IS 'Telegram chat ID for sending notifications to employer';
```

### 4. Frontend O'zgarishlar

#### 4a. IncomingJobs.tsx
**Qo'shilishi kerak:**
```typescript
// handleSubmit da, newJob yaratilgandan keyin:
if (employerId && newJob) {
  // Jobs jadvaliga ham qo'shish
  const { error: jobError } = await supabase
    .from('jobs')
    .insert({
      job_name: jobName,
      created_by: user!.id,
      status: 'ochiq',
      incoming_job_id: newJob.id,
      notes: `Ish beruvchi: ${selectedEmployer?.company_name || 'Noma\'lum'}`
    });
  
  if (jobError) console.error('Jobs jadvaliga qo\'shishda xatolik:', jobError);
}
```

#### 4b. OutgoingJobs.tsx
**Qo'shilishi kerak:**
```typescript
// handleSubmit da
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const qty = parseInt(quantitySent);
    
    // 1. Outgoing job yaratish (mavjud kod)
    if (editingJob) {
      // update logic
    } else {
      const { error } = await supabase
        .from('outgoing_jobs')
        .insert({
          incoming_job_id: id,
          quantity_sent: qty,
          notes, date,
          created_by: user?.id,
        });
      if (error) throw error;
      
      // 2. Incoming job va employer ma'lumotlarini olish
      const { data: incomingJobData } = await supabase
        .from('incoming_jobs')
        .select('*, employer:employers!employer_id(id, company_name, user_id, telegram_chat_id)')
        .eq('id', id)
        .single();
      
      // 3. Notification yaratish (ish beruvchi uchun)
      if (incomingJobData?.employer?.user_id) {
        await createNotification({
          title: 'Ish ketdi',
          body: `${incomingJobData.job_name} — ${qty} dona sizga jo'natildi`,
          type: 'info',
          related_table: 'outgoing_jobs',
          user_id: incomingJobData.employer.user_id,
        });
      }
      
      // 4. Telegram xabar yuborish
      if (incomingJobData?.employer?.telegram_chat_id) {
        await supabase.functions.invoke('send-telegram-notification', {
          body: {
            chat_id: incomingJobData.employer.telegram_chat_id,
            message: `🎉 Sizga ish keldi!\n\n` +
                    `📦 Ish: ${incomingJobData.job_name}\n` +
                    `📊 Miqdor: ${qty} dona\n` +
                    `📅 Sana: ${new Date(date).toLocaleDateString('uz-UZ')}\n\n` +
                    `✅ Ishlaringiz tayyor!`
          }
        });
      }
      
      // 5. Hammasi ketgan bo'lsa, Jobs'ni yopiq qilish
      const { data: allOutgoing } = await supabase
        .from('outgoing_jobs')
        .select('quantity_sent')
        .eq('incoming_job_id', id);
      
      const totalSent = (allOutgoing || []).reduce((sum, og) => sum + og.quantity_sent, 0) + qty;
      
      if (incomingJobData && totalSent >= incomingJobData.quantity) {
        // Jobs jadvalida tegishli ishni yopiq qilish
        await supabase
          .from('jobs')
          .update({ 
            status: 'yopiq',
            completed_at: new Date().toISOString()
          })
          .eq('incoming_job_id', id);
        
        toast.success('Ish to\'liq tugadi va yopildi!');
      }
    }
    
    resetForm();
    setOpen(false);
    fetchData();
  } catch (error) {
    toast.error("Xatolik yuz berdi");
  }
};
```

### 5. Edge Function: send-telegram-notification

**Fayl:** `supabase/functions/send-telegram-notification/index.ts`

```typescript
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
    const { data: settings } = await supabase
      .from("telegram_settings")
      .select("bot_token")
      .eq("is_active", true)
      .single();

    if (!settings?.bot_token) {
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
      throw new Error(`Telegram API error: ${JSON.stringify(result)}`);
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

### 6. ISH_BERUVCHI Dashboard

**Fayl:** `src/pages/EmployerDashboard.tsx`

**Qo'shilishi kerak:**
- Ketgan ishlar ro'yxati (outgoing_jobs filtered by employer_id)
- Real-time subscription - yangi outgoing job yaratilganda avtomatik yangilanish

## Amalga Oshirish Tartibi

1. ✅ **Migration 1** - jobs jadvaliga incoming_job_id qo'shish
2. ✅ **Migration 2** - employers jadvaliga telegram_chat_id qo'shish
3. ✅ **Edge Function** - send-telegram-notification yaratish
4. ✅ **IncomingJobs.tsx** - Jobs jadvaliga qo'shish logikasini qo'shish
5. ✅ **OutgoingJobs.tsx** - Notifications, Telegram, va Jobs yopish logikasini qo'shish
6. ✅ **EmployerDashboard.tsx** - Ketgan ishlar ko'rinishini qo'shish
7. ✅ **Test** - Barcha oqimlarni test qilish

## Xavfsizlik

- Edge Function faqat authenticated userlar chaqira oladi
- RLS policies mavjud qoidalarga mos keladi
- Telegram bot token xavfsiz saqlanadi (telegram_settings jadvalida)
- Employer faqat o'z ishlarini ko'ra oladi

## Savollar

1. **Telegram chat_id qanday olinadi?**
   - Ish beruvchi Telegram botga `/start` yuborganda, bot chat_id ni database ga saqlashi kerak
   - Webhook update qilish kerak

2. **Jobs va incoming_jobs o'rtasida to'g'ridan-to'g'ri bog'lanish kerakmi?**
   - Ha, incoming_job_id orqali
   - Bu orqali ketgan ishlar to'liq tugaganda Jobs ni yopish mumkin

3. **Bir incoming_job bir nechta jobs yaratishi mumkinmi?**
   - Yo'q, 1:1 munosabat
   - Bitta kelgan ish = bitta ishxona ishi

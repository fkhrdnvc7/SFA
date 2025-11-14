# Database Migration Qo'llanmasi

## Supabase'ga Jadval Yaratish

### Usul 1: Supabase Dashboard orqali (Tavsiya etiladi)

1. **Supabase Dashboard'ga kiring:**
   - https://supabase.com/dashboard ga kiring
   - Proyektingizni tanlang

2. **SQL Editor'ga o'ting:**
   - Chap menudan "SQL Editor" ni tanlang
   - "New query" tugmasini bosing

3. **Migration faylini yuklang:**
   - `supabase/complete_migration.sql` faylini oching
   - Barcha kodni nusxalab, SQL Editor'ga yopishtiring
   - "Run" tugmasini bosing yoki `Ctrl+Enter` bosing

4. **Natijani tekshiring:**
   - Agar xatolik bo'lmasa, "Success" xabari ko'rinadi
   - Table Editor'da barcha jadvallar yaratilganini tekshiring

### Usul 2: psql orqali (Agar parol bilsangiz)

```bash
psql -h db.qkuefveitzkqsbltkfxo.supabase.co -p 5432 -d postgres -U postgres -f supabase/complete_migration.sql
```

Parol so'ralganda, Supabase Dashboard > Settings > Database > Connection string > Show password orqali parolni oling.

## Yaratiladigan Jadvalar

1. **profiles** - Foydalanuvchilar profillari
2. **operations** - Tikish operatsiyalari katalogi
3. **jobs** - Ishlar
4. **job_items** - Ish elementlari
5. **attendance** - Davomat
6. **payroll_records** - Oylik to'lovlar
7. **audit_logs** - Audit loglari
8. **settings** - Sozlamalar
9. **colors** - Ranglar
10. **sizes** - O'lchamlar
11. **incoming_jobs** - Kelgan ishlar
12. **outgoing_jobs** - Ketgan ishlar

## Environment Variables

`.env` fayl quyidagi o'zgaruvchilarni o'z ichiga oladi:

```
VITE_SUPABASE_URL=https://qkuefveitzkqsbltkfxo.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Tekshirish

Migration muvaffaqiyatli bajarilgandan keyin:

1. Supabase Dashboard > Table Editor'da barcha jadvallar ko'rinishi kerak
2. `operations` jadvalida 16 ta operatsiya bo'lishi kerak (seed data)
3. RLS (Row Level Security) barcha jadvallarda yoqilgan bo'lishi kerak

## Muammolarni Hal Qilish

Agar xatolik bo'lsa:
- SQL Editor'da xatolik xabari ko'rinadi
- Xatolikni o'qing va tuzating
- Agar jadval allaqachon mavjud bo'lsa, `IF NOT EXISTS` qo'shilgan, shuning uchun xatolik bo'lmaydi


# Debug va Test Qilish Uchun Qo'llanma

## 1. Database Migration Tekshirish

Migration apply qilinganmi tekshirish uchun Supabase Dashboard -> SQL Editor'da quyidagi query'ni run qiling:

```sql
-- Check if approval_status column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'incoming_jobs' 
AND column_name IN ('approval_status', 'employer_price_per_unit', 'approved_at', 'approved_by', 'employer_notes', 'employer_total_price');
```

**Natija:** 6 ta column ko'rinishi kerak.

Agar column'lar yo'q bo'lsa:
- `supabase/migrations/20250624000000_employer_approval_workflow.sql` faylini SQL Editor'ga copy-paste qiling
- RUN tugmasini bosing

## 2. RLS Policy Tekshirish

```sql
-- Check RLS policies for employers
SELECT schemaname, tablename, policyname, roles
FROM pg_policies 
WHERE tablename = 'incoming_jobs' 
AND policyname IN ('Employers see their own jobs', 'Employers approve their jobs');
```

**Natija:** 2 ta policy ko'rinishi kerak.

## 3. Test User Yaratish (Agar hali yaratmagan bo'lsangiz)

### Step 1: Authentication -> Users -> Add User
- Email: `test@employer.com`
- Password: `test123456`
- Auto Confirm: **Yes**
- Create User

### Step 2: Update Profile Role
```sql
-- Update role to ISH_BERUVCHI
UPDATE public.profiles 
SET role = 'ISH_BERUVCHI', full_name = 'Test Ish Beruvchi'
WHERE email = 'test@employer.com';
```

### Step 3: Link to Employer Company
```sql
-- First, find employer ID
SELECT id, name FROM public.employers LIMIT 5;

-- Then link user to employer (replace 'Your Employer ID' with actual ID)
UPDATE public.employers
SET user_id = (SELECT id FROM public.profiles WHERE email = 'test@employer.com')
WHERE id = 'YOUR_EMPLOYER_ID_HERE';
```

## 4. Browser Console Debug

Ish beruvchi sifatida login qiling va browser console'ni oching (F12).

### Kutilayotgan ishlar sahifasida:
1. Network tab'ni oching
2. "Tasdiqlash" tugmasini bosing
3. Narx kiriting va "Tasdiqlash" tugmasini bosing
4. Console'da quyidagi xabarlar ko'rinishi kerak:
   ```
   Approving job: [job-id] with price: [price]
   Job approved successfully: {approval_status: 'approved', ...}
   ```

### Agar xatolik chiqsa:

**RLS Error (permission denied):**
```
Error: new row violates row-level security policy
```
**Yechim:** RLS policies to'g'ri apply qilinganini tekshiring.

**Column does not exist:**
```
Error: column "approval_status" does not exist
```
**Yechim:** Migration apply qilinmagan. Migration faylini run qiling.

## 5. Manual Test Steps

### Test 1: Notification Test
1. **Admin sifatida:**
   - Incoming Jobs sahifasiga o'ting
   - Yangi ish qo'shing
   - Employer tanlang (user_id bog'langan employer)
   - Save

2. **Ish beruvchi sifatida:**
   - Logout qiling
   - `test@employer.com` / `test123456` bilan login qiling
   - Notification bell'da yangi notification ko'rinishi kerak
   - "Kutilayotgan ishlar" sahifasida yangi ish ko'rinishi kerak

### Test 2: Approval Test
1. **Ish beruvchi sifatida:**
   - "Kutilayotgan ishlar" sahifasiga o'ting
   - Ishni tanlang va "Tasdiqlash" tugmasini bosing
   - Narx kiriting (masalan: 15000)
   - "Tasdiqlash" tugmasini bosing
   - Browser console'da xatolik bormi tekshiring
   - Sahifa refresh bo'lishi va ish yo'qolishi kerak (pending listdan)

2. **"Tasdiqlangan ishlar" sahifasiga o'ting:**
   - Tasdiqlangan ish ko'rinishi kerak
   - Narx ko'rinishi kerak

3. **Admin sifatida:**
   - Login qiling
   - Notification bell'da "Ish tasdiqlandi" xabari bo'lishi kerak
   - Incoming Jobs sahifasida approval status "Tasdiqlangan" bo'lishi kerak

## 6. Common Issues

### Issue: Notification ko'rinmayapti
**Sabab 1:** Employer'ning user_id bog'lanmagan
```sql
-- Check employer's user_id
SELECT e.id, e.name, e.user_id, p.email 
FROM employers e
LEFT JOIN profiles p ON p.id = e.user_id
WHERE e.is_active = true;
```
**Yechim:** user_id'ni to'g'ri employer'ga bog'lang

**Sabab 2:** Notification yaratilmagan
```sql
-- Check recent notifications
SELECT * FROM notifications 
ORDER BY created_at DESC 
LIMIT 10;
```

### Issue: Status o'zgarmasligi
**Sabab 1:** RLS policy to'g'ri emas
```sql
-- Test if user can update
SELECT EXISTS (
  SELECT 1 FROM public.profiles p
  JOIN public.employers e ON e.user_id = p.id
  WHERE p.id = auth.uid()
  AND p.role = 'ISH_BERUVCHI'
) as can_update;
```

**Sabab 2:** Migration apply qilinmagan
- Migration faylini qayta run qiling

## 7. Quick Debug SQL

```sql
-- All in one debug query
SELECT 
  'Employer Info' as section,
  e.name as employer_name,
  e.user_id,
  p.email as user_email,
  p.role as user_role
FROM employers e
LEFT JOIN profiles p ON p.id = e.user_id
WHERE e.is_active = true

UNION ALL

SELECT 
  'Recent Jobs' as section,
  ij.job_name,
  ij.approval_status,
  ij.employer_id,
  NULL
FROM incoming_jobs ij
ORDER BY ij.created_at DESC
LIMIT 5;
```

## 8. Success Criteria

✅ Migration columns mavjud
✅ RLS policies mavjud
✅ Test user yaratilgan (test@employer.com)
✅ Employer user_id bilan bog'langan
✅ Ish beruvchi notification oladi
✅ Ish beruvchi pending ishlarni ko'radi
✅ Tasdiqlash ishlaydi (status 'approved' ga o'zgaradi)
✅ Tasdiqlangan ishlar listida ko'rinadi
✅ Admin'ga notification boradi

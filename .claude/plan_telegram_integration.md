# Plan: Telegram Integration for Tailors (Tikuvchilar)

## Goal
Allow each tailor (seamstress) to check their work statistics via Telegram bot (@sfatailoring_bot). Admin can add optional Telegram Chat ID when creating new users.

## Current System Analysis

### Database Structure
- **profiles table**: Stores all users (ADMIN, MANAGER, SEAMSTRESS, ISH_BERUVCHI)
  - Fields: id, full_name, email, role, is_active, last_login, created_at, updated_at
  - No telegram_chat_id field currently
  
- **job_items table**: Tracks work done by each seamstress
  - Fields: seamstress_id, operation_id, quantity, unit_price, bonus_amount, job_id, color, size
  - Earnings calculation: (quantity × unit_price) + bonus_amount
  
- **telegram_settings table**: Already exists for bot configuration
- **employers table**: Already has telegram_chat_id field (reference pattern)

### Frontend
- **Users.tsx**: User creation form with email, password, full_name, role
- **MyEarnings.tsx**: Shows seamstress their own earnings (queries job_items by seamstress_id)

### Telegram Bot
- **telegram-webhook function**: Already handles /start, /hisobot, /statistika, /qarzlar commands
- Bot token and admin_chat_id stored in telegram_settings table

## Implementation Plan

### Phase 1: Database Migration
**File**: `supabase/migrations/20260629000003_add_telegram_chat_id_to_profiles.sql`

1. Add `telegram_chat_id` column to profiles table
   - Type: TEXT (nullable - not required)
   - Comment: 'Telegram chat ID for seamstress to check their work via bot'
   
2. Create index on telegram_chat_id for efficient lookups
   - `CREATE INDEX IF NOT EXISTS idx_profiles_telegram_chat_id ON public.profiles(telegram_chat_id);`

### Phase 2: Update User Creation Form
**File**: `src/pages/Users.tsx`

1. Add telegram_chat_id to Profile interface
2. Add telegram_chat_id state variable
3. Add telegram_chat_id input field to the form (optional, not required)
   - Label: "Telegram Chat ID (ixtiyoriy)"
   - Placeholder: "123456789"
   - Help text: "Tikuvchi Telegram bot orqali o'z ishini ko'rishi uchun"
4. Pass telegram_chat_id in signUp options metadata
5. Note: Field should be clearly marked as optional

### Phase 3: Telegram Bot Command Handler
**File**: `supabase/functions/telegram-webhook/index.ts`

1. Add new command handler for `/mening_ishim` (My Work)
   - When user sends /mening_ishim, bot will:
     - Get chat_id from message
     - Query profiles table to find user by telegram_chat_id
     - If not found, show registration message
     - If found, query job_items for that seamstress_id
     - Calculate and format work statistics

2. Create helper function: `generateSeamstressReport(supabase, userId)`
   - Query job_items with seamstress_id filter
   - Join with operations table to get operation names
   - Join with jobs table to get job names and status
   - Calculate:
     - Total items completed
     - Total earnings (sum of quantity × unit_price + bonus)
     - Breakdown by job
     - Today's work
     - This month's work
     - All time work

3. Format response message:
   ```
   👩‍🏭 MENING ISHLARIM
   
   📊 Bugungi ish:
   • Job nomi: 50 dona | 150,000 so'm
   Jami: 50 dona | 150,000 so'm
   
   📅 Shu oyda:
   • Jami: 500 dona | 1,500,000 so'm
   
   💰 Umumiy daromad:
   • Jami: 2,500 dona | 7,500,000 so'm
   
   🤖 SFA Tailoring bot
   ```

4. Add error handling:
   - Chat ID not registered: "Sizning Telegram akkauntingiz tizimga ulanmagan. Administrator bilan bog'laning."
   - No work found: "Hozircha sizga biriktirilgan ish mavjud emas."

### Phase 4: Update /start Command
**File**: `supabase/functions/telegram-webhook/index.ts`

Update the /start command message to include new command:
```
/hisobot — Bugungi hisobotni ko'rish
/statistika — Umumiy statistika
/qarzlar — Ish beruvchilar qarzlari
/mening_ishim — Mening ishlarimni ko'rish (tikuvchilar uchun)
```

### Phase 5: Testing Checklist

1. **Database Migration**
   - Run migration successfully
   - Verify column added to profiles table
   - Verify index created

2. **User Creation**
   - Create user without telegram_chat_id (should work)
   - Create user with telegram_chat_id (should save correctly)
   - Verify telegram_chat_id is stored in profiles table

3. **Telegram Bot**
   - Send /start command - verify new command listed
   - Send /mening_ishim without chat_id registered - verify error message
   - Register a test user's chat_id
   - Send /mening_ishim with registered chat_id - verify work stats shown
   - Verify calculations are correct

## Technical Notes

### How to Get Telegram Chat ID
User can:
1. Start chat with @userinfobot on Telegram
2. It will reply with their chat_id
3. Admin enters this ID when creating user in the system

### Security Considerations
- RLS policies on profiles table already exist
- Telegram webhook validates bot token from settings
- No sensitive data exposed (only work statistics)
- Chat ID is optional, system works without it

### Performance
- Index on telegram_chat_id ensures fast lookups
- Query optimization: Use JOIN instead of separate queries
- Limit historical data (e.g., last 6 months) if performance issues

## Files to Create/Modify

### New Files:
1. `supabase/migrations/20260629000003_add_telegram_chat_id_to_profiles.sql`

### Modified Files:
1. `src/pages/Users.tsx` - Add telegram_chat_id field
2. `supabase/functions/telegram-webhook/index.ts` - Add /mening_ishim command

## Estimated Changes:
- Database: ~10 lines (migration)
- Frontend: ~30 lines (form field + state)
- Backend: ~100 lines (new command handler + helper function)

## Dependencies:
- Existing Supabase setup
- Telegram bot already configured (@sfatailoring_bot)
- telegram_settings table populated with bot_token

## Rollback Plan:
If issues occur:
1. Database: Run `ALTER TABLE profiles DROP COLUMN telegram_chat_id;`
2. Frontend: Revert Users.tsx changes
3. Backend: Remove /mening_ishim command handler

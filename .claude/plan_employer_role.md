# Ish Beruvchi (Employer) Role Implementation Plan

## Current State Analysis

### Existing Structure:
- ✅ **Database**: `ISH_BERUVCHI` role already exists in user_role enum
- ✅ **Employers table**: Already created with basic info (name, phone, address, notes)
- ✅ **Employer transactions table**: Exists but not connected to job approval workflow
- ✅ **Notifications system**: Basic notification system exists
- ✅ **Incoming jobs**: Can select employer but no approval workflow

### Missing Components:
- ❌ **Job approval workflow**: No approval status field in incoming_jobs
- ❌ **Employer user accounts**: No link between employers table and profiles (user accounts)
- ❌ **Employer dashboard**: No UI for employers to see and approve their jobs
- ❌ **Employer authentication**: No way for employers to log in
- ❌ **Price confirmation**: No field for employer-entered pricing

## User Requirements

### Workflow (Two-step approval):
1. **ADMIN/MANAGER creates incoming job**:
   - Selects employer from list
   - Enters quantity received
   - Enters receiving price (cost to admin)
   
2. **System sends notification to employer**:
   - Notification appears in-app (bell icon)
   - Notification sent to employer's Telegram account
   
3. **Employer approves/rejects job** (Step 1):
   - Employer logs into system with their account
   - Reviews job details (name, quantity, date)
   - Clicks "Approve" or "Reject"
   
4. **Employer enters their price** (Step 2 - only after approval):
   - After clicking "Approve", price entry field appears
   - Employer enters the price they will pay per unit
   - Submits final approval with price
   - This becomes the revenue for the admin

### User Account Requirements:
- ✅ Each employer company gets a user account (email/password)
- ✅ Employer can log in to see their jobs
- ✅ Employer dashboard shows pending and approved jobs
- ✅ Role: ISH_BERUVCHI

## Proposed Solution

### Database Schema Changes

#### 1. Link employers to user accounts
```sql
-- Add user_id to employers table
ALTER TABLE public.employers ADD COLUMN user_id UUID REFERENCES public.profiles(id);

-- This allows an employer company to have a user account
```

#### 2. Add approval workflow to incoming_jobs
```sql
-- Add approval status and employer pricing
ALTER TABLE public.incoming_jobs 
  ADD COLUMN approval_status TEXT DEFAULT 'pending' 
    CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN approved_by UUID REFERENCES public.profiles(id),
  ADD COLUMN employer_price_per_unit NUMERIC(12, 2),
  ADD COLUMN employer_total_price NUMERIC(12, 2),
  ADD COLUMN employer_notes TEXT;

-- Indexes for performance
CREATE INDEX idx_incoming_jobs_approval_status ON public.incoming_jobs(approval_status);
CREATE INDEX idx_incoming_jobs_employer_id ON public.incoming_jobs(employer_id);
```

#### 3. Add telegram support to employers
```sql
-- Add telegram chat ID for notifications
ALTER TABLE public.employers 
  ADD COLUMN telegram_chat_id TEXT,
  ADD COLUMN telegram_username TEXT;
```

### Implementation Steps

#### Phase 1: Database Migration
1. Create migration file for new fields
2. Update RLS policies for employer access
3. Add policies for employers to view their own jobs

#### Phase 2: Backend/Types
1. Update Supabase types
2. Update notification system to support employer-specific notifications

#### Phase 3: Employer User Management
1. Add ability to create employer user accounts (ADMIN only)
2. Link employer companies to user accounts
3. Update Users page to support creating ISH_BERUVCHI users

#### Phase 4: Incoming Jobs Update
1. Update IncomingJobs.tsx to save approval_status='pending' on create
2. Send notification to employer's user_id when job is created
3. Add approval status badge to incoming jobs list

#### Phase 5: Employer Dashboard
1. Create EmployerDashboard.tsx page
   - Show pending jobs awaiting approval
   - Show approved jobs
   - Show job history
2. Create job approval modal
   - Show job details
   - Approve/Reject buttons
   - Price entry field (after approval)

#### Phase 6: Sidebar & Routing
1. Add employer-specific navigation items
2. Update Layout.tsx to show different menu for ISH_BERUVCHI role
3. Add routes for employer pages

#### Phase 7: Notifications
1. **In-app notifications**:
   - Send to employer's user_id when job is created (appears in bell)
   - Send to admin when employer approves/rejects
   
2. **Telegram notifications**:
   - Get employer's telegram_chat_id (add to employers table)
   - Send telegram message when job is created
   - Send telegram message to admin when approved/rejected
   - Create supabase edge function for telegram messaging

#### Phase 8: Telegram Integration
1. Add telegram_chat_id to employers table
2. Create edge function: `send-telegram-notification`
3. Update notification creation to trigger telegram send
4. Add telegram chat ID field to employer creation form

### RLS Policies Needed

```sql
-- Employers can see their own incoming jobs
CREATE POLICY "Employers see their own jobs"
ON public.incoming_jobs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.employers e ON e.user_id = p.id
    WHERE p.id = auth.uid()
    AND e.id = incoming_jobs.employer_id
    AND p.role = 'ISH_BERUVCHI'
  )
);

-- Employers can update approval fields on their jobs
CREATE POLICY "Employers approve their jobs"
ON public.incoming_jobs FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.employers e ON e.user_id = p.id
    WHERE p.id = auth.uid()
    AND e.id = incoming_jobs.employer_id
    AND p.role = 'ISH_BERUVCHI'
  )
)
WITH CHECK (
  -- Can only update specific fields
  approval_status IS NOT NULL
  OR employer_price_per_unit IS NOT NULL
  OR employer_notes IS NOT NULL
);
```

### UI Components Needed

1. **EmployerDashboard.tsx**: Main dashboard for employers
2. **JobApprovalModal.tsx**: Modal for approving jobs and entering price
3. **EmployerJobsList.tsx**: List of jobs for employer
4. **CreateEmployerUserModal.tsx**: Admin tool to create employer accounts

### Routing Updates

```typescript
// Add to App.tsx
{
  path: "/employer-dashboard",
  element: <EmployerDashboard />,
  // Only for ISH_BERUVCHI role
}
```

### Sidebar for Employer Role

```typescript
// In Layout.tsx, for ISH_BERUVCHI role show:
- Dashboard (employer-dashboard)
- Pending Jobs
- Approved Jobs
- Job History
- Profile Settings
```

## Benefits

1. **Clear workflow**: Employers can approve jobs in the system
2. **Transparent pricing**: Separate fields for receiving cost vs selling price
3. **Audit trail**: Track who approved what and when
4. **Notifications**: Real-time updates for both admin and employer
5. **Role separation**: Employers only see their own jobs

## Files to Create/Modify

### New Files:
- `supabase/migrations/YYYYMMDDHHMMSS_employer_approval_workflow.sql`
- `src/pages/EmployerDashboard.tsx`
- `src/components/JobApprovalModal.tsx`
- `src/pages/CreateEmployerUser.tsx` (or add to Users page)

### Modified Files:
- `src/integrations/supabase/types.ts` (after migration)
- `src/pages/IncomingJobs.tsx` (add approval status)
- `src/components/Layout.tsx` (employer menu items)
- `src/lib/notifications.ts` (employer notifications)
- `src/App.tsx` (new routes)

## Testing Checklist

- [ ] Create employer user account
- [ ] Admin creates incoming job with employer selected
- [ ] Employer receives notification
- [ ] Employer can log in and see pending jobs
- [ ] Employer can approve job
- [ ] Employer can enter price
- [ ] Admin sees approval status updated
- [ ] Admin receives notification of approval
- [ ] Proper permissions (employer can't see other employers' jobs)

## Future Enhancements (Not in this phase)

- Employer mobile app
- SMS notifications
- Automatic payment reminders
- Employer analytics dashboard
- Multiple contacts per employer company

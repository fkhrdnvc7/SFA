# Admin Panel Sidebar Reorganization Plan

## Current Problem
The sidebar has 17 navigation items in a flat list, making it cluttered and hard to navigate. Items are not grouped logically, and settings like Telegram are mixed with operational items.

## Goal
Reorganize the sidebar with logical grouping and create a dedicated Settings section for configuration items like Telegram.

## Proposed Structure

### 1. **Dashboard Section** (Always visible first)
- Bosh sahifa (Dashboard)

### 2. **Ish Boshqaruvi** (Work Management)
- Ishlar (Jobs) - ADMIN, MANAGER
- Vazifa berish (Task Assignment) - ADMIN, MANAGER  
- Vazifalarim (My Tasks) - SEAMSTRESS
- Kelgan ish (Incoming Jobs) - ADMIN, MANAGER
- Ketgan ish (Outgoing Jobs) - ADMIN, MANAGER
- Operatsiyalar (Operations) - ADMIN, MANAGER

### 3. **Ish Beruvchilar** (Employers)
- Ish beruvchilar (Employers) - ADMIN, MANAGER
- Moliyaviy hisob (Financial Account) - ADMIN

### 4. **Moliya** (Finance)
- Daromad (Revenue) - ADMIN, MANAGER
- Xarajatlar (Expenses) - ADMIN, MANAGER
- Oylik maosh (Payroll) - ADMIN, MANAGER
- Daromadlarim (My Earnings) - SEAMSTRESS

### 5. **Jamoat** (People/HR)
- Davomat (Attendance) - ADMIN
- Foydalanuvchilar (Users) - ADMIN

### 6. **Hisobotlar** (Reports)
- Hisobotlar (Reports) - ADMIN, MANAGER

### 7. **Sozlamalar** (Settings)
- Telegram - ADMIN
- (Future settings can be added here)

## Implementation Approach

### Step 1: Define Data Structure
Update the `navigationItems` array to support sections:
```typescript
interface NavSection {
  title?: string;  // Optional section title (undefined for Dashboard)
  items: NavItem[];
}
```

### Step 2: Reorganize Navigation Items
Restructure the navigation array into sections with proper ordering.

### Step 3: Add Section Headers Component
Create a visual separator/header for each section that:
- Displays section title
- Has subtle styling (uppercase, smaller text, muted color)
- Is not clickable
- Provides visual separation

### Step 4: Update NavItems Component
Modify the component to:
- Render section headers when title is present
- Maintain current styling for nav items
- Preserve role-based filtering logic

### Step 5: Maintain Responsive Behavior
Ensure the reorganization works on both:
- Desktop sidebar
- Mobile sheet menu

## Benefits

1. **Better Organization**: Related items grouped together
2. **Scalability**: Easy to add new settings without cluttering main navigation
3. **Visual Clarity**: Section headers provide clear mental model
4. **Settings Isolation**: Configuration items separated from operational items
5. **Future-Proof**: New features can be added to appropriate sections

## Files to Modify

- `src/components/Layout.tsx` - Main layout component with sidebar

## Testing Considerations

- Verify all navigation items still work
- Test role-based filtering (ADMIN, MANAGER, SEAMSTRESS)
- Confirm mobile menu displays sections correctly
- Check active state highlighting still works
- Ensure scroll behavior works with longer sidebar

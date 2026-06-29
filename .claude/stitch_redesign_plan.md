# SFA Tailoring - Stitch Carbon Precision Redesign Plan

## Maqsad
SFA Tailoring loyihasini to'liq Stitch Carbon Precision dizayn sistemasiga o'tkazish. Barcha sahifalar, komponentlar va rollar uchun bir xil professional dark theme.

## Stitch Dizayni Tahlili

### 🎨 Dizayn Xususiyatlari

#### 1. Color Palette (Carbon Dark)
```css
/* Base */
--background: #171717
--surface: #171717
--surface-container: rgba(24, 24, 27, 0.6) + backdrop-blur(24px)

/* Text */
--on-surface: #ffffff (white)
--on-surface-variant: #a1a1aa (light gray)

/* Primary */
--primary: #2563eb (professional blue)
--primary-container: #2563eb
--on-primary: #ffffff

/* Glass Effect */
background: rgba(24, 24, 27, 0.6)
backdrop-filter: blur(24px)
border: 1px solid rgba(255, 255, 255, 0.08)
box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3)
border-radius: 1rem (16px)
```

#### 2. Typography
```
Font: Inter
- headline-xl: 48px / 700 / -0.02em / 56px line-height
- headline-lg: 32px / 600 / -0.01em / 40px line-height
- headline-lg-mobile: 24px / 600 / 32px line-height
- body-md: 16px / 400 / 24px line-height
- body-sm: 14px / 400 / 20px line-height
- label-md: 12px / 600 / 0.05em / 16px (uppercase)
- mono-label: 13px / 500 / 18px (JetBrains Mono)
```

#### 3. Spacing System
```
unit: 4px
gutter: 24px
margin-mobile: 16px
margin-desktop: 40px
container-max: 1440px

Grid gaps: 24px (gap-6)
Card padding: 32px (p-8)
```

#### 4. Border Radius
```
default: 4px (0.25rem)
lg: 8px (0.5rem)
xl: 12px (0.75rem)
card: 16px (1rem)
full: 9999px
```

#### 5. Layout Structure

**Sidebar (Desktop - 256px):**
- Background: `#171717/80` + `backdrop-blur-xl`
- Border-right: `border-white/5`
- Logo area: p-8
- Primary action button: glass-button-primary
- Nav items: rounded-xl, hover bg-white/5
- Active: bg-white/5, text-white, icon filled
- Footer: border-t border-white/5

**Header (Desktop):**
- px-10 py-8
- headline-xl title
- Search bar: glass-card rounded-full
- Notification + Profile: glass-card rounded-full

**Header (Mobile - 64px):**
- bg-[#171717]/80 backdrop-blur-xl
- border-b border-white/5
- Logo + notifications + profile

**Main Content:**
- Padding: p-4 lg:px-10 pb-10 pt-0
- Max-width: 1600px mx-auto

**Bottom Nav (Mobile only):**
- Fixed bottom
- bg-[#171717]/90 backdrop-blur-2xl
- border-t border-white/5
- 4 items: Home, Orders, Tasks, Profile

#### 6. Glass Cards
```css
.glass-card {
  background-color: rgba(24, 24, 27, 0.6);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
  border-radius: 1rem;
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.4);
}
```

#### 7. Buttons
```css
/* Primary */
.glass-button-primary {
  background: #2563eb;
  hover: #1d4ed8 + shadow glow
  active: scale(0.97)
  transition: 0.2s
}

/* Secondary */
.glass-button-secondary {
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.1);
  hover: rgba(255,255,255,0.1)
}
```

#### 8. Bento Grid
```
Desktop (xl): 12 columns
Tablet (md): 2 columns
Mobile: 1 column
Gap: 24px (gap-6)

Stat cards: xl:col-span-3 (4 cards = 12 columns)
Main content: xl:col-span-8
Sidebar content: xl:col-span-4
```

#### 9. Stat Cards
- Icon: w-12 h-12 rounded-xl bg-color/10 border border-color/20
- Badge: rounded-full bg-emerald/red-500/10 text-emerald/red-400 border
- Label: text-on-surface-variant
- Value: font-headline-lg text-white

#### 10. Tables
- Border-collapse
- Header: border-b border-white/5, uppercase, mono-label
- Rows: border-b border-white/5
- Hover: glass-row (translateY(-2px) + bg change)

#### 11. Ambient Background
```html
<div class="fixed inset-0 z-[-1]">
  <div class="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] 
       rounded-full bg-primary/5 blur-[150px]"></div>
  <div class="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] 
       rounded-full bg-primary/5 blur-[180px]"></div>
</div>
```

#### 12. Animations
```css
@keyframes fadeInScale {
  0% { opacity: 0; transform: scale(0.98); }
  100% { opacity: 1; transform: scale(1); }
}

.fade-in-stagger > * {
  animation: fadeInScale 0.4s ease-out forwards;
  animation-delay: 150ms increments
}
```

## Implementation Plan

### Phase 1: Core Design System

#### 1.1. Update index.css
- Remove old glass effects
- Add Stitch Carbon Precision colors
- Add new glass-card class
- Add glass-button styles
- Add ambient background styles
- Add fade-in animations
- Add custom scrollbar

#### 1.2. Update tailwind.config.ts
- Add Carbon color palette
- Add typography scales
- Add spacing system
- Update border radius
- Add fadeInScale animation

#### 1.3. Create Glass Components
**New file:** `src/components/ui/glass-card.tsx`
- GlassCard component with hover-lift
- Variants: default, no-hover

**New file:** `src/components/ui/glass-button.tsx`
- Primary and Secondary variants
- Proper animations

### Phase 2: Layout Redesign

#### 2.1. Update Layout.tsx
**Sidebar (Desktop):**
- Width: 256px (w-64)
- Background: bg-[#171717]/80 backdrop-blur-xl
- Border: border-r border-white/5
- Logo section: p-8, icon + title + subtitle
- Primary action button (if admin)
- Navigation sections with proper styling
- Footer with settings

**Header (Desktop):**
- Remove top bar, only show in main content area
- Title section in main content

**Header (Mobile):**
- h-16, bg-[#171717]/80 backdrop-blur-xl
- border-b border-white/5
- Logo + notifications + profile

**Bottom Nav (Mobile):**
- Fixed bottom-0
- 4 main items
- Active state with filled icons

**Main Content Area:**
- Add ambient background
- Proper padding: p-4 lg:px-10

**Background:**
- bg-[#171717]
- Ambient gradient circles

#### 2.2. Update Navigation
- Map current routes to Stitch style
- 4 main sections for ISH_BERUVCHI: Admin, Manager, Production, Employer
- 4 main sections for ADMIN/MANAGER: Dashboard, Orders, Tasks, Reports
- 4 main sections for SEAMSTRESS: Dashboard, Tasks, Earnings, Profile

### Phase 3: Dashboard Redesign

#### 3.1. Dashboard.tsx (ADMIN/MANAGER/SEAMSTRESS)

**Structure:**
```
<AmbientBackground />
<main class="p-4 lg:px-10">
  <header class="mb-8">
    <h1 class="headline-xl">Dashboard Title</h1>
    <p class="text-on-surface-variant">Subtitle</p>
  </header>
  
  <BentoGrid>
    <!-- 4 Stat Cards: xl:col-span-3 -->
    <StatCard icon label value badge />
    
    <!-- Main Table: xl:col-span-8 -->
    <GlassCard>
      <Table />
    </GlassCard>
    
    <!-- Sidebar Actions: xl:col-span-4 -->
    <div class="flex flex-col gap-6">
      <GlassCard>Quick Actions</GlassCard>
      <GlassCard>Mini Stats</GlassCard>
    </div>
  </BentoGrid>
</main>
```

**Components:**
- StatCard: Icon + Label + Value + Trend badge
- Table: glass-card with proper headers
- Quick Actions: Primary + Secondary buttons
- Fade-in stagger animation

#### 3.2. EmployerDashboard.tsx
Similar structure adapted for ISH_BERUVCHI role

### Phase 4: Page-by-Page Redesign

**Priority 1 (High Traffic):**
1. Dashboard.tsx ✓
2. EmployerDashboard.tsx
3. Jobs.tsx - table view with glass cards
4. IncomingJobs.tsx - job cards grid
5. Tasks.tsx - task cards
6. MyTasks.tsx - seamstress tasks

**Priority 2 (Medium Traffic):**
7. Users.tsx - user cards grid
8. Attendance.tsx - calendar glass design
9. Revenue.tsx - financial cards
10. Expenses.tsx - expense cards
11. Payroll.tsx - payroll table
12. MyEarnings.tsx - earnings view

**Priority 3 (Settings & Reports):**
13. Reports.tsx - report cards
14. Operations.tsx - operations grid
15. Colors.tsx - color picker
16. Sizes.tsx - size manager
17. TelegramSettings.tsx - settings form
18. OutgoingJobsList.tsx
19. JobDetails.tsx

### Phase 5: Component Updates

#### 5.1. Update Dialogs/Modals
- Glass background
- Proper backdrop
- Rounded corners
- Smooth animations

#### 5.2. Update Forms
- Glass input fields
- Proper focus states
- Labels with proper styling

#### 5.3. Update Tables
- Glass containers
- Hover row effects
- Proper typography

#### 5.4. Update Badges/Chips
- Color-coded with proper opacity
- Rounded-full
- Border variants

### Phase 6: Responsive Design

#### Mobile (<640px):
- Single column layout
- Bottom navigation
- Stacked stat cards
- Simplified table (card view)

#### Tablet (640-1024px):
- 2 column grid
- Adjusted padding
- Medium spacing

#### Desktop (>1024px):
- Full 12-column bento grid
- Sidebar visible
- Maximum spacing

## File Changes Checklist

### Core Files
- [ ] src/index.css - complete rewrite
- [ ] tailwind.config.ts - update config
- [ ] src/components/Layout.tsx - complete redesign
- [ ] src/components/NavLink.tsx - update styles

### New Components
- [ ] src/components/ui/glass-card.tsx
- [ ] src/components/ui/glass-button.tsx
- [ ] src/components/ui/stat-card.tsx
- [ ] src/components/ui/ambient-background.tsx
- [ ] src/components/ui/bento-grid.tsx (update existing)

### Dashboard Pages
- [ ] src/pages/Dashboard.tsx
- [ ] src/pages/EmployerDashboard.tsx
- [ ] src/pages/AdminEmployerDashboard.tsx

### Feature Pages
- [ ] src/pages/Jobs.tsx
- [ ] src/pages/IncomingJobs.tsx
- [ ] src/pages/OutgoingJobsList.tsx
- [ ] src/pages/Tasks.tsx
- [ ] src/pages/MyTasks.tsx
- [ ] src/pages/Users.tsx
- [ ] src/pages/Attendance.tsx
- [ ] src/pages/Revenue.tsx
- [ ] src/pages/Expenses.tsx
- [ ] src/pages/Payroll.tsx
- [ ] src/pages/MyEarnings.tsx

### Config Pages
- [ ] src/pages/Operations.tsx
- [ ] src/pages/Colors.tsx
- [ ] src/pages/Sizes.tsx
- [ ] src/pages/Reports.tsx
- [ ] src/pages/TelegramSettings.tsx
- [ ] src/pages/EmployerPendingJobs.tsx
- [ ] src/pages/EmployerApprovedJobs.tsx
- [ ] src/pages/EmployerRejectedJobs.tsx
- [ ] src/pages/EmployerStatistics.tsx
- [ ] src/pages/EmployerFinance.tsx
- [ ] src/pages/JobDetails.tsx
- [ ] src/pages/OutgoingJobs.tsx

### Update UI Components
- [ ] src/components/ui/card.tsx - simplify to work with glass
- [ ] src/components/ui/button.tsx - match glass styles
- [ ] src/components/ui/input.tsx - dark glass style
- [ ] src/components/ui/dialog.tsx - glass backdrop
- [ ] src/components/ui/table.tsx - glass table styles
- [ ] src/components/ui/badge.tsx - color variants

## Design Tokens

```typescript
// Colors
const colors = {
  background: '#171717',
  surface: '#171717',
  'surface-container': 'rgba(24, 24, 27, 0.6)',
  'on-surface': '#ffffff',
  'on-surface-variant': '#a1a1aa',
  primary: '#2563eb',
  'primary-hover': '#1d4ed8',
  'border-glass': 'rgba(255, 255, 255, 0.08)',
  'border-glass-hover': 'rgba(255, 255, 255, 0.12)',
}

// Spacing (based on 4px unit)
const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  6: '24px',
  8: '32px',
  10: '40px',
}

// Typography
const typography = {
  'headline-xl': { size: '48px', weight: 700, lineHeight: '56px', letterSpacing: '-0.02em' },
  'headline-lg': { size: '32px', weight: 600, lineHeight: '40px', letterSpacing: '-0.01em' },
  'headline-lg-mobile': { size: '24px', weight: 600, lineHeight: '32px' },
  'body-md': { size: '16px', weight: 400, lineHeight: '24px' },
  'body-sm': { size: '14px', weight: 400, lineHeight: '20px' },
  'label-md': { size: '12px', weight: 600, lineHeight: '16px', letterSpacing: '0.05em' },
}
```

## Success Criteria

✅ Dark theme with #171717 background
✅ Glass cards with blur(24px) everywhere
✅ Proper spacing: 24px gaps, 32px padding
✅ Bento grid: 12 columns on desktop
✅ Responsive: mobile bottom nav, tablet 2-col, desktop full
✅ Animations: fade-in-stagger on load, hover-lift on cards
✅ Typography: Inter font with proper scales
✅ Icons: Material Symbols Outlined
✅ Ambient background: subtle gradient circles
✅ Consistent across ALL pages and ALL roles
✅ Performance: smooth 60fps animations

## Notes

- Keep ALL business logic unchanged
- Only update visual design and layout
- Maintain role-based access control
- Preserve Supabase integration
- Keep all routes and navigation working
- Test with all 4 roles: ADMIN, MANAGER, SEAMSTRESS, ISH_BERUVCHI

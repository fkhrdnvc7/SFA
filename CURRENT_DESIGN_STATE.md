# SFA Tailoring - Hozirgi Dizayn Holati

## Loyiha Ma'lumotlari
- **Tech Stack**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Port**: localhost:8081
- **Rollar**: ADMIN, MANAGER, SEAMSTRESS, ISH_BERUVCHI

## Hozirgi Dizayn Xususiyatlari

### 1. Rang Sxemasi (Color Scheme)
```css
/* Light Mode */
- Background: #f9f9ff (juda och lavender)
- Primary: #2563eb (ko'k rang - blue)
- Card: #ffffff (oq)
- Sidebar: #111827 (qora-kulrang)
- Border: #c3c6d7 (och kulrang)

/* Dark Mode */
- Background: #0d1117 (qora)
- Primary: #3b82f6 (yorqin ko'k)
- Card: #1a1f2e (to'q kulrang)
```

### 2. Layout Struktura

#### Sidebar (Chap tomon - 280px)
- Qora-kulrang background (#111827)
- Glass effect: `rgba(17, 24, 39, 0.85)` + blur(16px)
- Collapsible sections:
  - Dashboard
  - Ish Boshqaruvi (7 items)
  - ~~Ish Beruvchilar~~ (comment out - yashirilgan)
  - Moliya (4 items)
  - Jamoat (2 items)
  - Hisobotlar (1 item)
  - Sozlamalar (1 item)

#### Header (Top - 64px)
- Glass effect: `rgba(255, 255, 255, 0.4)` + blur(20px)
- Left: Mobile menu button + Logo
- Right: Notification bell + User profile chip

#### Main Content
- Background: `bg-mesh-gradient` (gradient circles)
- Max-width: 7xl (1280px)
- Padding: 24px (lg:24px, mobile:16px)

### 3. Komponentlar

#### Cards
3 variant mavjud:
1. **default**: `rounded-lg border bg-white shadow-sm`
2. **glass**: `rounded-2xl glass-card` (shaffof, blur)
3. **solid**: `rounded-lg border bg-white shadow-md`

#### BentoGrid
- Responsive grid: 1 col (mobile) → 2 col (tablet) → 4 col (desktop)
- Sizes: sm, md (2 col), lg (2x2), xl (4 col)
- Auto-rows: minmax(200px, auto)
- Gap: 16px (gap-4)

#### Stat Cards
- Glass variant BentoCard
- Icon (colored circle) + Label + Value + Trend
- Hover: translateY(-4px) + shadow

#### Quick Actions
- Grid layout: 2→3→4 columns
- Glass effect buttons
- Rounded-xl borders
- Hover: -translate-y-1 + scale icon

### 4. Animatsiyalar
```css
- fade-in: opacity 0→1, translateY 4px→0 (0.25s)
- shimmer: backgroundPosition -1000px→1000px (2s infinite)
- float: translateY 0→-10px→0 (3s infinite)
- bento-item hover: translateY(-4px) (0.3s cubic-bezier)
```

### 5. Typography
- Font: Inter (system-ui fallback)
- Page Title: text-2xl font-bold
- Section Title: text-lg font-semibold
- Stat Display: text-3xl font-bold
- Table Header: text-xs font-semibold uppercase

### 6. Responsive Breakpoints
- Mobile: <640px (sm)
- Tablet: 640px-1024px (md)
- Desktop: >1024px (lg)

## Hozirgi Muammolar / Sizga Yoqmagan Joylar

1. **Glass Effect** - juda shaffof, o'qish qiyin
2. **Mesh Gradient Background** - ortiqcha rang-barang
3. **Bento Grid** - turli o'lchamlar chalkash
4. **Animatsiyalar** - hover effektlari sekin/ortiqcha
5. **Sidebar** - qorong'i, boshqa qismlar bilan mos kelmaydi
6. **Blur Effect** - performance muammosi bo'lishi mumkin

## Fayllar Ro'yxati

### O'zgartirilgan Fayllar:
1. `src/index.css` - glass effects, gradients
2. `tailwind.config.ts` - animations, backdrop blur
3. `src/components/ui/bento-grid.tsx` - yangi komponent
4. `src/components/ui/card.tsx` - variant prop qo'shildi
5. `src/components/Layout.tsx` - glass sidebar/header, employers menu yashirilgan
6. `src/pages/Dashboard.tsx` - BentoGrid layout

### O'zgartirilmagan Fayllar (eski dizayn):
- `src/pages/Jobs.tsx`
- `src/pages/Users.tsx`
- `src/pages/IncomingJobs.tsx`
- `src/pages/Tasks.tsx`
- `src/pages/Attendance.tsx`
- `src/pages/Reports.tsx`
- `src/pages/Revenue.tsx`
- `src/pages/Expenses.tsx`
- Va boshqa 10+ sahifa

## Tech Details

### Mavjud UI Library
- shadcn/ui components (Button, Card, Dialog, Input, etc.)
- Lucide React icons
- Tailwind CSS utilities
- React Router DOM

### State Management
- Supabase (backend)
- React hooks (useState, useEffect)
- React Query (@tanstack/react-query)

### Build Tool
- Vite (fast HMR)
- npm run dev → localhost:8081

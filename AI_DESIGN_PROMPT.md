# AI Prompt: SFA Tailoring Yangi Dizayn

## Context
Men SFA Tailoring Management System uchun yangi, zamonaviy va professional dizayn yaratishni xohlayman. Hozirgi dizaynda liquid glass + bento grid ishlatilgan, lekin u menga yoqmadi. Men yanada sodda, toza va professional ko'rinishni xohlayman.

## Loyiha Texnologiyalari
- React + TypeScript + Vite
- Tailwind CSS
- shadcn/ui komponentlari
- Lucide React icons
- 4 ta rol: ADMIN, MANAGER, SEAMSTRESS, ISH_BERUVCHI

## Hozirgi Dizaynning Kamchiliklari
1. Glass effect juda shaffof - matn o'qish qiyin
2. Mesh gradient background ortiqcha rang-barang
3. Bento grid turli o'lchamlar chalkash
4. Sidebar qora, boshqa qismlar och - mos kelmaydi
5. Hover animatsiyalar sekin va ortiqcha

## Men Qanday Dizaynni Xohlayman

### Umumiy Stilistika
- **Minimalist va Clean**: Ortiqcha effektlarsiz, sodda va tushunarli
- **Professional**: Korporativ, ishbilarmon ko'rinish
- **Modern**: 2024-2025 yilgi zamonaviy UI/UX trendlari
- **Readable**: Yaxshi contrast, o'qish qulay
- **Consistent**: Barcha elementlar bir xil dizayn tilida

### Rang Sxemasi (3 variant taklif qiling)

#### Variant 1: Neutral Professional
- Light background (och kulrang yoki oq)
- Sidebar: och yoki medium kulrang (qora emas!)
- Primary: professional ko'k yoki yashil
- Cards: oq, yengil shadow
- No gradients, no glass effects

#### Variant 2: Modern Colorful
- Rangli aksentlar (masalan: ko'k + yashil yoki binafsha + pushti)
- Light sidebar (oq yoki och rang)
- Colorful icon backgrounds
- Flat design, no 3D effects

#### Variant 3: Dark Mode Elegance
- Professional dark theme
- Sidebar va background bir xil tus oilasida
- Soft contrasts, eye-friendly
- Subtle accent colors

### Layout Requirements

#### Sidebar (Chap - 280px)
- **Och rangli** yoki medium kulrang (qora emas!)
- Oddiy background, glass/blur yo'q
- Clear section headers
- Active item ko'rinib turishi kerak
- Hover: yengil background change
- Logo + navigation + user profile footer

#### Top Header (64px)
- Minimalist
- Left: Logo (mobile), Menu button (mobile)
- Right: Notifications + User profile chip
- Light background
- Bottom border yoki shadow

#### Main Content Area
- Oq yoki och kulrang background
- Max-width: centered (1280px)
- Generous padding va spacing
- No gradient backgrounds!

### Card Dizayni
- **Oddiy, toza cards**
- Border: yengil kulrang
- Shadow: subtle (masalan: 0 1px 3px rgba(0,0,0,0.1))
- Rounded corners: 8-12px (juda katta emas)
- No glass effects, no backdrop blur
- Hover: yengil shadow increase yoki border color change

### Dashboard Layout
Men bento grid emas, **oddiy responsive grid** xohlayman:
- Stat cards: 1x4 grid (mobile: 1x1)
- Barcha cards bir xil o'lchamda
- Gap: 16-24px
- Quick actions: regular grid, bir xil buttonlar

### Stat Cards
- Icon (rangli circle yoki square)
- Label (kichik, uppercase yoki normal)
- Value (katta, bold)
- Trend indicator (optional, sodda arrow + %)
- Clean layout, yaxshi spacing

### Buttons va Actions
- Flat yoki slightly raised
- Clear hover states (background change, no transform)
- Consistent sizing
- Icon + Text yoki faqat Icon

### Typography
- Clean, readable
- Clear hierarchy
- Font size differences aniq
- Line height: generous
- Font: Inter yoki boshqa zamonaviy sans-serif

### Animations
- **Minimal va fast**
- Transitions: 150-200ms
- Hover: faqat color/background change
- No floating, no shimmer, no transform animations
- Smooth page transitions: fade-in only

### Spacing va Layout
- Generous whitespace
- Consistent padding: 16px, 24px, 32px
- Grid gaps: 16px yoki 24px
- No cramped elements

## Mening Talablarim

1. **Remove ALL glass effects** - no backdrop-blur, no transparent backgrounds
2. **Remove mesh gradient background** - solid color yoki subtle texture
3. **Replace BentoGrid** - regular responsive grid
4. **Simplify animations** - fast, minimal
5. **Fix sidebar color** - light or medium, not dark
6. **Consistent design language** - all pages should look cohesive
7. **Employers menu stays hidden** - keep it commented out

## Qaysi Fayllarni O'zgartirish Kerak

### Majburiy O'zgartirishlar:
1. `src/index.css` - remove glass classes, add new clean styles
2. `tailwind.config.ts` - remove excessive animations
3. `src/components/ui/card.tsx` - simplify variants
4. `src/components/Layout.tsx` - redesign sidebar and header
5. `src/pages/Dashboard.tsx` - simple grid layout

### BentoGrid:
- `src/components/ui/bento-grid.tsx` - delete or replace with simple grid

### Boshqa Sahifalar (Priority):
- `src/pages/Jobs.tsx`
- `src/pages/Users.tsx`
- `src/pages/IncomingJobs.tsx`
- (Other pages can use the same design system)

## Deliverables

Menga quyidagilarni bering:

1. **Design System Document**
   - Color palette (specific HSL values)
   - Typography scale
   - Spacing system
   - Component styles

2. **Updated Code Files**
   - index.css - new clean styles
   - tailwind.config.ts - simplified config
   - card.tsx - clean card component
   - Layout.tsx - redesigned layout
   - Dashboard.tsx - simple grid layout

3. **Design Rationale**
   - Why this color scheme?
   - Why this layout approach?
   - How it solves previous issues?

## Inspiration (Optional)

Men quyidagi dizaynlarni yoqtiraman (misol sifatida):
- Linear.app - clean, minimalist
- Notion - simple, readable
- GitHub UI - professional, clear
- Stripe Dashboard - elegant, data-focused
- Vercel Dashboard - modern, fast

## Important Notes

- Keep ALL existing functionality - only change styling!
- Maintain role-based navigation
- Keep Supabase integration as is
- Preserve all business logic
- Only update visual design and layout

## Success Criteria

✅ No glass effects, no blur
✅ Light/medium sidebar (not dark)
✅ Clean, readable cards
✅ Simple responsive grid (not bento)
✅ Minimal, fast animations
✅ Professional, modern look
✅ Consistent across all pages
✅ Good contrast and readability

---

**Iltimos, yuqoridagi talablarga asosan to'liq dizayn tizimini va kod o'zgarishlarini taqdim eting. Men hozirgi liquid glass dizayni emas, sodda va professional ko'rinishni xohlayman.**

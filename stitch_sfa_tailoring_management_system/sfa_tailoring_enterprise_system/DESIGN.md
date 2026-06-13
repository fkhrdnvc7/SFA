---
name: SFA Tailoring Enterprise System
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daea'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eefe'
  surface-container-high: '#e2e8f8'
  surface-container-highest: '#dce2f3'
  on-surface: '#151c27'
  on-surface-variant: '#434655'
  inverse-surface: '#2a313d'
  inverse-on-surface: '#ebf1ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#575e70'
  on-secondary: '#ffffff'
  secondary-container: '#d9dff5'
  on-secondary-container: '#5c6274'
  tertiary: '#943700'
  on-tertiary: '#ffffff'
  tertiary-container: '#bc4800'
  on-tertiary-container: '#ffede6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#dce2f7'
  secondary-fixed-dim: '#c0c6db'
  on-secondary-fixed: '#141b2b'
  on-secondary-fixed-variant: '#404758'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7d2d00'
  background: '#f9f9ff'
  on-background: '#151c27'
  surface-variant: '#dce2f3'
typography:
  stat-display:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  page-title:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  section-title:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 28px
  body-main:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  table-header:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-padding: 24px
  element-gap: 16px
  sidebar-width: 280px
  grid-gutter: 20px
---

## Brand & Style
The design system is built for the high-precision environment of garment manufacturing management. It utilizes a **Corporate / Modern** aesthetic, prioritizing clarity, efficiency, and data density. The visual narrative is defined by professional stability, using a clean utility-first approach inspired by modern functional interfaces. 

The target audience consists of factory managers and operators who require a "tool-like" interface that stays out of the way. The UI evokes a sense of organized control and reliability through structured layouts, high-contrast typography, and a purposeful use of color to indicate system status (Success, Danger, Warning).

## Colors
This design system uses a functional color palette optimized for enterprise dashboards. 

- **Primary (Moviy):** Used for primary actions, active states, and brand recognition.
- **Surface Colors:** The main workspace uses a light gray background (`#F9FAFB`) to reduce eye strain, while the sidebar utilizes a high-contrast dark theme (`#111827`) to separate navigation from content.
- **Semantic Colors:** Green (Muvaffaqiyat), Red (Xavf), and Amber (Ogohlantirish) are reserved strictly for status indicators and destructive actions to maintain their psychological impact.
- **Neutral:** A range of grays manages information hierarchy, with `#6B7280` serving as the primary color for secondary text and icons.

## Typography
The system relies exclusively on **Inter** to ensure maximum legibility for data-heavy views. 

- **Information Hierarchy:** Page titles (Sahifa sarlavhasi) use bold weights at 24px to provide immediate context. Stats (Statistika) are emphasized at 32px to ensure key factory KPIs are glanceable.
- **Data Tables:** Table headers use a specialized 13px uppercase style to differentiate structural metadata from row content.
- **Content:** The base body size is 14px, providing an optimal balance between readability and data density for management software.

## Layout & Spacing
The layout follows a **Fixed Sidebar + Fluid Content** model. 

- **Sidebar:** Fixed at 280px. It houses the primary navigation (Navigatsiya).
- **Canvas:** The main content area uses a 24px inner padding. 
- **Grid:** Content is organized into cards that respond to a 12-column grid system. On desktop, cards typically span 3 columns for stats and 12 columns for primary data tables.
- **Mobile Adaptivity:** At 768px (Tablet), the sidebar collapses into a hamburger menu. On mobile (375px+), page padding reduces to 16px and all grid columns stack vertically.

## Elevation & Depth
This design system uses **Low-contrast outlines** and subtle tonal layering rather than heavy shadows.

- **Cards:** Defined by a 1px solid border (`#E5E7EB`) rather than shadows. This creates a "flat-on-flat" look that feels modern and organized.
- **Modals:** Use a soft ambient shadow (0px 10px 15px -3px rgba(0, 0, 0, 0.1)) to lift the component above the semi-transparent overlay.
- **Sidebar Depth:** The dark sidebar background provides the primary depth cue, visually "pushing" the main content area forward.

## Shapes
The shape language is professional and balanced. 
- **Cards & Containers:** Use a 12px (`rounded-lg`) radius to soften the technical nature of the factory data.
- **Buttons & Inputs:** Use a slightly tighter 8px (`rounded-md`) radius to maintain a precise, interactive feel.
- **Badges:** Use a full pill-shape (999px) to clearly distinguish status tags from interactive buttons.

## Components

### Buttons (Tugmalar)
- **Primary:** Background `#2563EB`, text `#FFFFFF`. 8px radius.
- **Secondary:** White background, 1px border `#E5E7EB`, text `#374151`.
- **Danger:** Background `#DC2626`, text `#FFFFFF`.

### Sidebar (Yon panel)
- Fixed dark theme (`#111827`). 
- **Active State:** Navigation items get a `2px solid #2563EB` left border, a subtle white background highlight at 10% opacity, and white text.
- **Inactive State:** Gray `#9CA3AF` text and icons.

### Stat Cards (Statistika kartalari)
- Title (Label) in `#6B7280`.
- Large bold number in `#111827`.
- **Icon:** Contained in a circular background with 10% opacity of the icon color (e.g., Blue icon on light blue circle).
- **Trend:** Small text below or beside the stat (e.g., +12% "O'sish").

### Badges (Nishonlar)
- Pill-shaped with a 10-15% opacity background of the core semantic color and 100% opacity text for contrast.
- **Success:** Background green-100, text green-700 ("Faol").
- **Warning:** Background amber-100, text amber-700 ("Kutilmoqda").
- **Danger:** Background red-100, text red-700 ("To'xtatilgan").

### Tables (Jadvallar)
- **Header:** Background `#F9FAFB`, bottom border `#E5E7EB`.
- **Rows:** White background, thin bottom border.
- **Hover:** Rows transition to `#F3F4F6` on hover to assist with horizontal eye tracking.

### Inputs (Kiritish maydonlari)
- 8px radius, 1px border `#D1D5DB`. Focus state uses a 2px blue ring with 20% opacity.
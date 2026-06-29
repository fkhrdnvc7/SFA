---
name: Carbon Precision
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#c3c6d7'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#8d90a0'
  outline-variant: '#434655'
  surface-tint: '#b4c5ff'
  primary: '#b4c5ff'
  on-primary: '#002a78'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#0053db'
  secondary: '#adc6ff'
  on-secondary: '#002e6a'
  secondary-container: '#0566d9'
  on-secondary-container: '#e6ecff'
  tertiary: '#ffb596'
  on-tertiary: '#581e00'
  tertiary-container: '#bc4800'
  on-tertiary-container: '#ffede6'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7d2d00'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-label:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  container-max: 1440px
---

## Brand & Style

The design system is engineered for high-performance developer tools and precision engineering interfaces. It evokes a sense of technical mastery, speed, and depth through a "Liquid Glass" aesthetic. The atmosphere is nocturnal and focused, minimizing eye strain while using light to guide attention.

The visual style merges **Glassmorphism** with **Minimalism**. It utilizes high-index backdrop blurs (20px+) and semi-transparent layers to create a sense of physical space within a digital environment. Surfaces are not merely flat planes but translucent "Carbon" sheets that interact with the layers beneath them.

**Key Attributes:**
- **Materiality:** High-end glass with varying levels of opacity and diffusion.
- **Precision:** Razor-sharp borders and systematic alignment.
- **Atmosphere:** Dark, immersive, and high-contrast for critical data.

## Colors

The palette is anchored by the deep, neutral "Carbon" background, providing a canvas for high-contrast interactive elements.

- **Primary (#2563eb):** A professional, high-energy blue used for primary actions and focus states.
- **Surface Strategy:** Backgrounds are strictly `#171717`. Surfaces (cards, modals) use a semi-transparent white or blue overlay (e.g., `rgba(255, 255, 255, 0.03)`) combined with a heavy backdrop-blur to achieve the glass effect.
- **Border Accents:** Interaction boundaries use subtle `rgba(255, 255, 255, 0.1)` for neutral depth or `rgba(37, 99, 235, 0.2)` to indicate active or primary-themed containers.

## Typography

The design system relies on **Inter** to deliver a systematic, utilitarian feel. The hierarchy is defined by varying weights and tight letter-spacing in larger headlines to maintain a "machined" look.

- **Headlines:** Use Bold (700) or Semi-Bold (600) with slight negative letter-spacing to emphasize the liquid-glass density.
- **Body:** Kept at Regular (400) for maximum legibility against dark backgrounds.
- **Labels:** Small caps or uppercase labels are used for technical metadata and navigation elements.

## Layout & Spacing

This design system uses a **Fluid Grid** approach within a fixed max-width container for desktop. The spacing rhythm is based on a 4px baseline, ensuring all components align to a predictable technical grid.

- **Desktop:** 12-column grid, 24px gutters, 40px margins.
- **Tablet:** 8-column grid, 16px gutters, 24px margins.
- **Mobile:** 4-column grid, 16px gutters, 16px margins.

Padding within glass components should be generous (typically 24px or 32px) to allow the background blur effect to feel spacious and premium.

## Elevation & Depth

Depth is conveyed through **backery-blur and cumulative opacity** rather than traditional drop shadows.

1.  **Level 0 (Base):** Solid `#171717`.
2.  **Level 1 (Cards):** `rgba(255, 255, 255, 0.03)` fill with `backdrop-filter: blur(20px)`.
3.  **Level 2 (Modals/Popovers):** `rgba(255, 255, 255, 0.08)` fill with `backdrop-filter: blur(40px)`.
4.  **Outer Glow:** Instead of shadows, use a 1px inner border (`rgba(255, 255, 255, 0.1)`) to catch the "light" at the edge of the glass.

## Shapes

The shape language is refined and consistent, using a 12px (0.75rem) base radius.

- **Standard (12px):** Used for buttons, input fields, and standard cards.
- **Large (24px):** Used for primary container groupings or large modal overlays.
- **Interactive States:** When hovered, shapes do not change radius, but their border opacity increases to emphasize the physical edge.

## Components

### Buttons
- **Primary:** Solid `#2563eb` with a subtle white-to-transparent top-down gradient (10% opacity) to simulate a glass sheen.
- **Secondary:** Glass-fill (`white/5`) with a `blue/20` border.
- **Transitions:** 150ms "cubic-bezier(0.4, 0, 0.2, 1)" for all hover/active states.

### Input Fields
- Dark transparent background (`rgba(0, 0, 0, 0.2)`) with a 1px `white/10` border.
- On focus, the border transitions to `primary-blue` with a subtle 4px outer glow of the same color.

### Cards
- Always feature `backdrop-filter: blur(24px)`.
- Borders must be 1px solid `rgba(255, 255, 255, 0.08)`.

### Chips & Badges
- Small, 12px rounded corners.
- Backgrounds are high-saturation but low-opacity (e.g., `primary/15`) with a solid-color text label.

### Progress Bars & Sliders
- Track: Solid `#262626`.
- Fill: `primary-blue` with a "liquid" animation—a subtle 1px white line that travels across the leading edge of the progress fill.
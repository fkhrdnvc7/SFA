---
name: Liquid Precision
colors:
  surface: '#081425'
  surface-dim: '#081425'
  surface-bright: '#2f3a4c'
  surface-container-lowest: '#040e1f'
  surface-container-low: '#111c2d'
  surface-container: '#152031'
  surface-container-high: '#1f2a3c'
  surface-container-highest: '#2a3548'
  on-surface: '#d8e3fb'
  on-surface-variant: '#c3c6d7'
  inverse-surface: '#d8e3fb'
  inverse-on-surface: '#263143'
  outline: '#8d90a0'
  outline-variant: '#434655'
  surface-tint: '#b4c5ff'
  primary: '#b4c5ff'
  on-primary: '#002a78'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#0053db'
  secondary: '#7bd0ff'
  on-secondary: '#00354a'
  secondary-container: '#00a6e0'
  on-secondary-container: '#00374d'
  tertiary: '#c0c1ff'
  on-tertiary: '#1000a9'
  tertiary-container: '#585be6'
  on-tertiary-container: '#f1eeff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#c4e7ff'
  secondary-fixed-dim: '#7bd0ff'
  on-secondary-fixed: '#001e2c'
  on-secondary-fixed-variant: '#004c69'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#081425'
  on-background: '#d8e3fb'
  surface-variant: '#2a3548'
typography:
  display-lg:
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
  title-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
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
  margin-sm: 16px
  margin-lg: 32px
  bento-gap: 16px
---

## Brand & Style
The design system is engineered for SFA Tailoring, balancing the tactile heritage of bespoke craftsmanship with high-tech ERP efficiency. The brand personality is **Professional, Technical, and Fluid**. It evokes a sense of "digital silk"—smooth, high-end, and meticulously organized.

The primary design movement is **Liquid Glassmorphism**. This style utilizes varying levels of translucency and refraction to create a multi-layered workspace that feels deep yet lightweight. By leaning into a professional corporate aesthetic, the UI maintains the functional rigor required for enterprise resource planning while offering a premium, futuristic interface.

## Colors
The palette is rooted in deep professional blues and slates to ensure a high-contrast, focus-driven environment.

- **Primary (#2563eb):** Used for critical actions, active states, and brand highlights.
- **Secondary (#38bdf8):** A lighter azure for accents, data visualization, and progress indicators.
- **Neutral (#1e293b):** The foundation for backgrounds and container fills.
- **Glass Surfaces:** Containers use a semi-transparent slate with a background blur to maintain legibility over moving or complex data visualizations.
- **Semantic Colors:** Use standard emerald for "Completed" tailoring tasks, amber for "In Progress," and rose for "Delayed" or "Alert."

## Typography
This design system utilizes **Inter** for all primary communication to ensure maximum readability in data-heavy ERP environments. For technical metadata, SKU numbers, and measurements, **JetBrains Mono** is employed to provide a distinct "industrial" feel that aids in error-free reading.

Typography follows a strict hierarchy. Large headers use tighter letter spacing and heavier weights to command attention, while body text remains neutral and highly legible. All measurement-related labels should be rendered in the Monospace label style to differentiate them from prose.

## Layout & Spacing
The layout logic follows a **Bento Grid** philosophy, particularly for dashboards. Content is grouped into modular rectangular "pods" that vary in size based on the importance of the data.

- **Grid:** A 12-column system is used on desktop, collapsing to 1 column on mobile.
- **Bento Modules:** Use a consistent 16px or 24px gap between modules.
- **Padding:** Internal container padding is generous (minimum 24px) to ensure the glass edges do not crowd the content.
- **Responsiveness:** On mobile, Bento tiles stack vertically. On tablet, tiles may span 2 columns to maximize screen real estate.

## Elevation & Depth
Depth is created through the interplay of transparency and light. 

1.  **Backdrop-Blur:** All primary containers must apply a `backdrop-filter: blur(20px)`.
2.  **Borders:** Use 1px "inner-glow" strokes. On the top and left edges, use a slightly more opaque white (rgba 255, 255, 255, 0.15) to simulate a light source, and a more subtle stroke on the bottom/right.
3.  **Shadows:** Shadows are not black; they are tinted with the background color (e.g., `rgba(15, 23, 42, 0.4)`). They should be highly diffused with a large spread to create an "ambient lift."
4.  **Z-Axis:** 
    - Level 0: Main background (Dark slate).
    - Level 1: Bento modules (Glass).
    - Level 2: Overlays and Modals (High-saturation glass with 40px blur).

## Shapes
The shape language is sophisticated and approachable. The standard radius is **0.5rem (8px)** for small elements like buttons and inputs, while larger containers and Bento tiles use **1rem (16px)** to emphasize the "liquid" feel. 

Avoid sharp corners entirely; even nested elements must follow a concentric corner radius logic where the outer radius is larger than the inner to maintain visual harmony.

## Components
- **Buttons:** Primary buttons use a solid #2563eb fill with a slight glow effect on hover. Secondary buttons are "Ghost Glass" with a 1px white border and blur.
- **Bento Cards:** The cornerstone of the system. They feature a glass background, subtle internal shadow, and a hover state that increases the brightness of the border.
- **Inputs:** Fields are semi-transparent with a 1px bottom border that expands to a full 1px surround on focus. Use JetBrains Mono for numeric measurement inputs.
- **Lists:** Tailoring orders are displayed in rows with a glass separator. Hovering over a row should trigger a subtle lift (2px Y-axis) and an increase in backdrop-blur.
- **Chips/Status:** High-saturation, low-opacity pills (e.g., a green pill with 10% opacity and 100% opacity text).
- **Animations:**
    - **Hover Lift:** 200ms ease-out, -4px Y-translation.
    - **Page Entry:** Staggered fade-in (150ms delay between elements) with a slight "scale-up" from 98% to 100%.
    - **Interaction:** Button clicks should provide a subtle "depress" effect (97% scale).
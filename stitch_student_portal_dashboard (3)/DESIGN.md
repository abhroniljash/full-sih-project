---
name: Academic Clarity
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#464555'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#7e3000'
  on-tertiary: '#ffffff'
  tertiary-container: '#a44100'
  on-tertiary-container: '#ffd2be'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb695'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7b2f00'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-lg:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Manrope
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  stat-display:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  container-padding: 24px
  card-gap: 20px
  section-margin: 32px
  stack-sm: 8px
  stack-md: 16px
---

## Brand & Style

The design system is engineered for the modern academic environment, prioritizing cognitive ease and professional reliability. The aesthetic is rooted in **Corporate Modernism** with a heavy emphasis on a "Card-based" architecture. It aims to evoke a sense of organized calm, helping students navigate complex data like attendance and grades without feeling overwhelmed.

The visual language utilizes significant whitespace to create clear separation between different data modules. Information is encapsulated within structured containers that use subtle borders rather than heavy shadows to maintain a flat, contemporary profile. The overall tone is academic, trustworthy, and efficiency-driven.

## Colors

The palette is derived from a sophisticated mix of deep indigos and slate grays, grounded by a high-brightness background.

- **Primary**: A vibrant Indigo used for primary actions, active states, and critical branding elements.
- **Secondary**: A deep Slate used for primary headings and high-contrast text to ensure maximum legibility.
- **Neutral**: A range of cool grays (Slate 50 to 200) used for page backgrounds, card borders, and secondary metadata.
- **Accents**: Light indigo washes are used for "Ghost" buttons and chip backgrounds (e.g., the roll number badge) to provide a soft distinction without adding visual weight.
- **Background**: A near-white surface (#F8FAFC) is used to minimize eye strain during long study sessions.

## Typography

**Manrope** is selected as the sole typeface for its exceptional legibility and balanced geometric construction. It bridges the gap between technical precision and approachable design.

- **Headlines**: Use a bold weight with tight letter-spacing for a modern, "impactful" look in dashboard headers.
- **Body**: Regular weight with generous line height (1.5x) to ensure long-form data is readable.
- **Stats**: Large, extra-bold numerical displays are used within summary cards to make key metrics (like attendance percentages) the first thing a user notices.
- **Labels**: Semi-bold, slightly tracked-out labels are used for metadata and chip text to maintain clarity at small sizes.

## Layout & Spacing

The layout follows a **Fixed-Width Grid** on desktop (max-width 1200px) and transitions to a **Fluid Single-Column** layout on mobile. 

- **Grid System**: A 12-column grid is used for desktop. Dashboard cards typically span 4 columns (for small stats) or 12 columns (for wide charts/logs).
- **Margins**: Mobile devices utilize a 16px side margin, while tablet and desktop use a 24px-32px margin.
- **Rhythm**: All spacing is based on a 4px baseline. Components are separated by 20px (card-gap) to maintain a sense of openness.
- **Grouping**: Related items (like a heading and its sub-label) should use an 8px vertical stack, while distinct content blocks use 16px.

## Elevation & Depth

This design system avoids heavy drop shadows in favor of **Tonal Layers** and **Low-Contrast Outlines**.

- **Level 0 (Background)**: The base page color (#F8FAFC).
- **Level 1 (Cards)**: White surfaces (#FFFFFF) with a 1px border (#E2E8F0). No shadow is applied in its default state to keep the UI "flat" and fast.
- **Interactive State**: Upon hover or focus, a card may receive a very soft, diffused ambient shadow (8px blur, 4% opacity, Slate tint) to indicate interactivity.
- **Overlays**: Modals and dropdowns use a crisp 1px border with a slightly more pronounced shadow to separate them from the dashboard surface.

## Shapes

The shape language is consistently **Rounded**, reflecting a modern and friendly student-centric interface.

- **Cards & Large Containers**: Use a 12px (0.75rem) or 16px (1rem) corner radius to soften the dashboard's structured layout.
- **Buttons & Inputs**: Use an 8px (0.5rem) radius.
- **Badges/Chips**: Use a full-pill radius (999px) to distinguish them from interactive buttons.
- **Icon Enclosures**: Small icons inside stats cards should be housed in soft-square containers with a 10px radius.

## Components

### Cards
Cards are the primary container. Every card must have a 1px border (#E2E8F0). Top-level cards (like the "Welcome" banner) should have 32px of internal padding, while smaller stat cards use 24px.

### Buttons
- **Primary**: Solid Indigo (#4F46E5) with white text.
- **Secondary/Ghost**: Light Indigo background (#E0E7FF) with Indigo text. Used for less critical actions like "View History".

### Badges & Chips
Used for status indicators (e.g., "Present", "Late") or ID numbers. These should have a subtle background tint and high-contrast text in the same color family.

### Inputs
Text fields should have a light gray stroke (#E2E8F0) that turns Indigo on focus. Labels should always sit above the input field, never inside as placeholder text only.

### Lists/Logs
Attendance logs should be presented as a vertical stack of Level 1 containers or rows separated by thin 1px dividers. Each row should have a clear timestamp and status indicator on the trailing edge.

### Stat Icons
Small decorative icons used in summary cards should be monochromatic, using the primary color at a low opacity for the background and full opacity for the glyph.
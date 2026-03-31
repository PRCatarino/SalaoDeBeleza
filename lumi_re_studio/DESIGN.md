# The Design System: Editorial Precision for the Modern Atelier

## 1. Overview & Creative North Star
**The Creative North Star: "The Digital Concierge"**

This design system rejects the cluttered, "utility-first" look of legacy SaaS. Instead, it adopts a **High-End Editorial** aesthetic—blending the efficiency of *Linear* with the tactile elegance of a luxury fashion magazine. We are not building a database; we are building a curated workspace for artisans.

To break the "template" look, we prioritize **intentional asymmetry** and **tonal depth**. Rather than a rigid grid of boxes, elements should feel like they are floating on a series of premium paper stocks. We use extreme typographic scaling (Manrope for high-impact displays) contrasted with ultra-functional utility type (Inter) to create an authoritative, premium rhythm.

---

## 2. Colors: Tonal Architecture
We move away from the "line-drawing" era of UI. Structure is defined by light and weight, not by strokes.

### Color Strategy
- **Primary (`#6D28D9`):** Our "Signature Purple." Use it sparingly for high-intent actions and brand moments.
- **Surface Hierarchy:** We utilize the `surface-container` tiers to create a "nested" look.
- **The "No-Line" Rule:** Do not use 1px solid borders to separate sections. Boundaries must be created via background shifts. For example, a `surface-container-low` sidebar sitting against a `surface` background.
- **The Glass & Gradient Rule:** For floating modals or navigation overlays, use a `backdrop-blur` of 12px–20px with a semi-transparent `surface-container-lowest`. Main CTAs should use a subtle linear gradient from `primary` to `primary-container` to add "soul" and prevent a flat, synthetic feel.

| Token | Hex | Role |
| :--- | :--- | :--- |
| `surface` | #F8F9FF | The base canvas (clean, airy). |
| `surface-container-low` | #EFF4FF | Secondary background areas (sidebars/tables). |
| `surface-container-highest`| #D3E4FE | Active states or elevated accents. |
| `on-surface-variant` | #4A4455 | Soft instructional text/metadata. |

---

## 3. Typography: The Editorial Scale
We use a dual-font system to balance "Beauty" and "Business."

- **The Voice (Manrope):** Used for `display` and `headline` roles. Its geometric yet warm curves mirror modern aesthetics clinics.
- **The Engine (Inter):** Used for `title`, `body`, and `labels`. It is optimized for the high-density data management (booking schedules, inventory) that salon owners face daily.

**Scale Highlights:**
- **Display-LG (Manrope, 3.5rem):** Reserved for empty states or "Hero" metrics (e.g., total monthly revenue).
- **Title-MD (Inter, 1.125rem):** The standard for card headers and navigation.
- **Label-SM (Inter, 0.6875rem):** All-caps with increased tracking for technical metadata (e.g., "SKU: 4920").

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are often "dirty." We use **Ambient Shadows** and **Tonal Stacking** to create a sense of organized calm.

- **The Layering Principle:** Place a `surface-container-lowest` (#FFFFFF) card on a `surface-container-low` (#EFF4FF) background. This creates a natural "lift" without a single pixel of shadow.
- **Ambient Shadows:** When an element must float (e.g., a dropdown or popover), use a multi-layered shadow: `0 8px 32px rgba(11, 28, 48, 0.06)`. The tint is derived from `on-surface`, never pure black.
- **The "Ghost Border" Fallback:** If accessibility requires a container boundary, use `outline-variant` at 15% opacity. It should be felt, not seen.
- **Glassmorphism:** Use `surface-container-low` at 80% opacity with a blur for top navigation bars to allow the brand colors of the dashboard content to "bleed" through as the user scrolls.

---

## 5. Components: Precision Elements

### Cards & Lists (The "No Divider" Rule)
Forbid the use of horizontal divider lines. Separate list items using `spacing-4` (1rem) and subtle background hovers. 
- **Card Radius:** Always `lg` (1rem / 16px) for main containers to feel soft and approachable.
- **Card Padding:** Use `spacing-6` (1.5rem) to ensure content has "breathing room."

### Buttons
- **Primary:** Gradient from `primary` to `primary-container`. Corner radius: `md` (0.75rem).
- **Secondary:** `surface-container-highest` background with `on-primary-fixed-variant` text. No border.
- **Tertiary:** Ghost style. No background until hover.

### Input Fields
- **Default State:** `surface-container-lowest` background with a `ghost-border`. 
- **Focus State:** 2px solid `primary`.
- **Labeling:** Use `label-md` in `on-surface-variant` positioned precisely 8px above the input.

### Specialized App Components
- **The Timeline Scheduler:** Use `surface-container-low` for "Off-hours" and `surface-container-lowest` for "Available hours." No grid lines; use tonal shifts.
- **Stat Glossaries:** Large `display-sm` numbers with `label-sm` descriptors, styled as editorial "pull quotes" rather than standard dashboard tiles.

---

## 6. Do’s and Don’ts

### Do
- **Use White Space as a Tool:** If a layout feels cluttered, add spacing instead of adding lines.
- **Align to the Baseline:** Ensure Inter and Manrope align perfectly on a 4px baseline grid.
- **Use "Signature Purple" with Intent:** Save the vibrant `#6D28D9` for the "Money Action" (Book Appointment, Checkout).

### Don’t
- **Don’t use pure black:** Use `on-background` (#0B1C30) for text to maintain a premium, deep-navy warmth.
- **Don’t use default shadows:** Never use the `0 0 5px rgba(0,0,0,0.5)` standard. It looks "cheap" and dated.
- **Don’t use 100% opaque borders:** They trap the eye and break the "Digital Concierge" flow. 
- **Don’t overcrowd cards:** If you can’t fit the data with `spacing-5` padding, the data needs a new page.
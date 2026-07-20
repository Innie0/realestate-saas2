# UI Design Brief — Oikaro

## 1. Reference points

- **Emulate:** Solidroad — atmospheric sections over icon grids, muted neutral palette, avatar-based social proof with real metrics (not star ratings), generous whitespace, minimal chrome nav, scroll-scrubbed pinned hero moments.
- **Do NOT emulate:** Purple-gradient SaaS templates, generic AI landing pages with floating blobs, uniform pill-everywhere UI, scroll-jacking on every section.

## 2. Color tokens

```json
{
  "background": "#F7F6F3",
  "surface": "#FFFFFF",
  "text-primary": "#1A1A18",
  "text-secondary": "#6B6862",
  "accent": "#D9ED41",
  "accent-foreground": "#18181B",
  "accent-muted": "#B8C4B4",
  "border": "#E4E2DC"
}
```

- **background** — page sections, manifesto band, FAQ, footer
- **surface** — cards, nav when scrolled, showcase, pricing cards
- **accent** — primary CTAs only (lime chartreuse)
- **accent-muted** — faded headlines, inactive rail items, subtle washes

## 3. Typography

- **Display / headline:** EB Garamond, weight 400–500, `-0.02em` tracking — H1, manifesto, showcase headline fade
- **Body:** Geist Sans, weight 400, 16px base, 1.6 line-height
- **Utility / labels:** IBM Plex Mono, weight 500, uppercase, 12px, wide tracking — eyebrows, metrics, data labels

## 4. Spacing & layout scale

```json
{
  "spacing-unit": "8px",
  "scale": [4, 8, 16, 24, 32, 48, 64, 96, 128],
  "max-content-width": "1200px",
  "border-radius": { "small": "6px", "medium": "10px", "large": "16px" },
  "shadow": "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)"
}
```

Code source of truth: `lib/marketing-design.ts`

## 5. Signature element

**Ours:** Scroll-scrubbed pinned hero cross-fading real product screenshots; testimonial cards lead with monospace metrics instead of star ratings; manifesto uses serif text-fade (dark → light lines), not background morph.

## 6. Explicit anti-patterns

- No purple-to-blue gradients
- No glassmorphism / frosted-glass cards
- No floating 3D blob or abstract gradient shapes behind product shots
- No generic checkmark-icon feature grids
- No uniform `border-radius: 24px` on every element
- No stock AI robot or animated fake dashboard mockups — use `/public/landing/*.png` screenshots
- No full-page scroll-interpolated beige/sand wash

## 7. Component build order

Hero → Nav → Showcase (pinned scroll) → Testimonials → Manifesto → Integrations → FAQ → Pricing → Footer → Marketing subpages

## 8. Scroll transitions & motion

- **Pinned (max 2):** Hero (~65vh scrub track), showcase uses click-to-preview (normal scroll height)
- **Scrub tied to scroll progress** — reverses on scroll up
- **All other sections:** 16px fade-up on enter only
- **`prefers-reduced-motion`:** collapse pins to static layout

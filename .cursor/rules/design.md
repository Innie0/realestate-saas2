# UI Design Brief — Oikaro (Framer-style)

**Core idea:** Every section's main visual is a real app screenshot inside a simple browser-window frame. The product IS the content.

**Color discipline:** Neutral cream/white/black page chrome. Color only inside product screenshots (badges, pills) and on primary CTA buttons (`#E4F76C`).

**Typography:** Inter, weights 400 + 500 only. No serif, no mono on marketing chrome.

**Animation:** No scroll-pinning. (1) Fade-up on enter via IntersectionObserver. (2) Product-alive timers inside mockups (typing, badge pop).

**Tokens:** `lib/marketing-design.ts`

**Anti-patterns:** No scroll-scrub, no stock photography, no purple gradients, no glassmorphism, no serif display type, no accent as page theming, no icon-grid features.

**Browser frame:** 32px bar, 3 gray dots, 1px `#E7E5DD` border, 10px radius, no shadow.

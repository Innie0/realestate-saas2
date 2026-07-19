# Landing page product media

Edit product copy in **`lib/landing-features.ts`** (`LANDING_FEATURES` array).  
Helper docs: **`lib/products.ts`**.

## Screenshots

Replace each PNG with a real app screenshot (recommended: **1440×900**, cropped from the top).

| File | Product page |
|------|----------------|
| `ai-assistant.png` | `/products/ai-assistant` |
| `projects.png` | `/products/projects` |
| `property-research.png` | `/products/property-research` |
| `leads-inbox.png` | `/products/leads-inbox` |
| `lead-capture.png` | `/products/lead-capture` |
| `clients.png` | `/products/clients` |
| `transactions.png` | `/products/transactions` |
| `calendar.png` | `/products/calendar` |
| `open-houses.png` | `/products/open-houses` |
| `ads.png` | `/products/ads` |
| `dashboard.png` | `/products/dashboard` |
| `hero-assistant.png` | Homepage hero (optional) |

Keep the same filename — set `imageSrc` in `LANDING_FEATURES` if you use a different path.

## Videos (optional)

Drop MP4 or WebM in `public/landing/videos/` and set `videoSrc` on that product, e.g.:

```ts
videoSrc: '/landing/videos/ai-assistant.mp4',
```

Video replaces the screenshot when the file loads.

## Hide until ready

On any product in `LANDING_FEATURES`:

```ts
published: false,
```

It stays reachable at `/products/[id]` but won’t show on `/products`.

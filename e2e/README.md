# End-to-end tests (Playwright)

## Run

```bash
npm run test:e2e
```

Optional:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e
E2E_USER_EMAIL=you@example.com E2E_USER_PASSWORD=secret npm run test:e2e
npm run test:e2e:report
```

## Requirements

- `.env.local` with valid `NEXT_PUBLIC_SUPABASE_*` keys
- `OPENAI_API_KEY` for Projects AI + AI Assistant tests
- Valid `SUPABASE_SERVICE_ROLE_KEY` for **public lead capture** (`POST /api/leads`) — tests will flag if missing
- Optional: `CRON_SECRET` to exercise follow-up cron in leads test
- Optional: `GOOGLE_CLIENT_ID/SECRET` for live Google Ads OAuth URL generation

## Test user

By default, global setup creates/signs in `e2e-playwright@oikaro.test` (dev-only free-pro bypass).

Override with `E2E_USER_EMAIL` + `E2E_USER_PASSWORD`.

## Coverage

| Spec | What it verifies |
|------|------------------|
| `projects.spec.ts` | Create project, AI content generation persists |
| `transactions.spec.ts` | Create tx, link clients, update closing date |
| `clients.spec.ts` | Add + edit client via UI, verify API |
| `leads.spec.ts` | Public lead POST, inbox + follow-up flag |
| `property-research.spec.ts` | Demo lookup + CMA API returns valuation |
| `ads.spec.ts` | Connections/campaigns APIs + Ad accounts UI |
| `calendar.spec.ts` | Create event + sync API |
| `ai-assistant.spec.ts` | Assistant tool calls create project/client/event |

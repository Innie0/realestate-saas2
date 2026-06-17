# Stripe pricing setup

## Quick setup (recommended)

With `STRIPE_SECRET_KEY` in `.env.local`:

```bash
npm run stripe:setup-prices
```

This script will:
1. Create or reuse **Realestic Starter** and **Realestic Pro** products in Stripe
2. Create recurring prices at the amounts below (skips if a matching price already exists)
3. Write the price IDs into `.env.local`

Then add the **same four env vars** to [Vercel](https://vercel.com) → Project → Settings → Environment Variables and redeploy.

## Prices

| Plan | Interval | Amount | Env variable |
|------|----------|--------|--------------|
| Starter | Monthly | **$49.00** | `NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID` |
| Pro | Monthly | **$99.00** | `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` |
| Starter | Yearly | **$490.00** | `NEXT_PUBLIC_STRIPE_STARTER_ANNUAL_PRICE_ID` |
| Pro | Yearly | **$990.00** | `NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID` |

Free trial: **7 days**, configured in checkout (`trial_period_days`).

## Billing portal

Users manage subscriptions from **Account → Manage billing in Stripe** (`POST /api/stripe/portal`).

Enable the Customer Portal in Stripe Dashboard → **Settings → Billing → Customer portal** (cancel, update payment method, view invoices).

## Annual billing UI

The pricing page shows the **Annual** toggle when at least one annual price ID env var is set.

## Existing subscribers

Stripe does **not** auto-update existing subscriptions when you create new prices. Options:
1. **Grandfather** current customers on old prices until they change plans
2. **Migrate** manually in Stripe or via the Customer Portal
3. Use Stripe **subscription schedules** for a planned price change with notice

## Verify

1. Run `npm run stripe:setup-prices` (or set env vars manually)
2. Add vars to Vercel and redeploy
3. Test checkout: Starter monthly, Pro monthly, annual plans
4. Test **Manage billing** on the Account page
5. Confirm webhook updates `subscription_plan` with the new price ID

## Webhook events

Ensure your Stripe webhook endpoint (`/api/stripe/webhook`) listens for:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

Use the signing secret in `STRIPE_WEBHOOK_SECRET`.

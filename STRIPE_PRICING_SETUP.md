# Stripe pricing setup

After updating display prices, create **new recurring prices** in the [Stripe Dashboard](https://dashboard.stripe.com/products) and add the price IDs to your environment variables.

## Prices to create

| Plan | Interval | Amount | Env variable |
|------|----------|--------|--------------|
| Starter | Monthly | **$49.00** | `NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID` |
| Pro | Monthly | **$99.00** | `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` |
| Starter | Yearly | **$490.00** | `NEXT_PUBLIC_STRIPE_STARTER_ANNUAL_PRICE_ID` |
| Pro | Yearly | **$990.00** | `NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID` |

Each price should:
- Be **recurring**
- Include a **7-day free trial** (configured in checkout via `trial_period_days`, or set on the Stripe price)
- Replace the old $19.99 / $39.99 price IDs in Vercel (and `.env.local`)

## Annual billing UI

The pricing page shows the **Annual** toggle only when at least one annual price ID env var is set. Until then, users see monthly plans only.

## Existing subscribers

Stripe does **not** auto-update existing subscriptions when you create new prices. Options:
1. **Grandfather** current customers on old prices until they change plans
2. **Migrate** manually in Stripe or via the Customer Portal
3. Use Stripe **subscription schedules** for a planned price change with notice

## Verify

1. Set env vars locally and in Vercel
2. Redeploy
3. Test checkout for Starter monthly, Pro monthly, and annual (if enabled)
4. Confirm webhook updates `subscription_plan` with the new price ID

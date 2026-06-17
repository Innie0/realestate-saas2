#!/usr/bin/env node
/**
 * Creates (or reuses) Stripe products/prices for Realestic plans and updates .env.local.
 *
 * Usage: node --env-file=.env.local scripts/create-stripe-prices.mjs
 */

import Stripe from 'stripe';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const envPath = path.join(root, '.env.local');

const secret = process.env.STRIPE_SECRET_KEY;
if (!secret || secret === 'dummy-key-for-build') {
  console.error('Missing STRIPE_SECRET_KEY. Set it in .env.local first.');
  process.exit(1);
}

const stripe = new Stripe(secret);

const PLANS = [
  {
    productName: 'Realestic Starter',
    productDescription: 'Starter plan — CRM, listings, lead capture, and property tools.',
    prices: [
      { key: 'NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID', amount: 4900, interval: 'month', label: 'Starter monthly ($49)' },
      { key: 'NEXT_PUBLIC_STRIPE_STARTER_ANNUAL_PRICE_ID', amount: 49000, interval: 'year', label: 'Starter annual ($490)' },
    ],
  },
  {
    productName: 'Realestic Pro',
    productDescription: 'Pro plan — unlimited listings, lookups, AI, and lead tools.',
    prices: [
      { key: 'NEXT_PUBLIC_STRIPE_PRO_PRICE_ID', amount: 9900, interval: 'month', label: 'Pro monthly ($99)' },
      { key: 'NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID', amount: 99000, interval: 'year', label: 'Pro annual ($990)' },
    ],
  },
];

async function findOrCreateProduct(name, description) {
  const listed = await stripe.products.list({ active: true, limit: 100 });
  const existing = listed.data.find((p) => p.name === name);
  if (existing) {
    console.log(`  Product exists: ${name} (${existing.id})`);
    return existing;
  }
  const created = await stripe.products.create({ name, description });
  console.log(`  Created product: ${name} (${created.id})`);
  return created;
}

async function findOrCreatePrice(productId, unitAmount, interval, label) {
  const listed = await stripe.prices.list({ product: productId, active: true, limit: 100 });
  const existing = listed.data.find(
    (p) =>
      p.unit_amount === unitAmount &&
      p.currency === 'usd' &&
      p.recurring?.interval === interval,
  );
  if (existing) {
    console.log(`  Reusing price: ${label} → ${existing.id}`);
    return existing;
  }
  const created = await stripe.prices.create({
    product: productId,
    unit_amount: unitAmount,
    currency: 'usd',
    recurring: { interval },
    metadata: { plan: label },
  });
  console.log(`  Created price: ${label} → ${created.id}`);
  return created;
}

function updateEnvFile(updates) {
  if (!fs.existsSync(envPath)) {
    console.error('.env.local not found — add these manually:\n');
    for (const [k, v] of Object.entries(updates)) console.log(`${k}=${v}`);
    return;
  }

  let content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n');

  for (const [key, value] of Object.entries(updates)) {
    const idx = lines.findIndex((line) => line.startsWith(`${key}=`));
    const entry = `${key}=${value}`;
    if (idx >= 0) {
      lines[idx] = entry;
    } else {
      lines.push(entry);
    }
  }

  fs.writeFileSync(envPath, lines.join('\n').replace(/\n*$/, '\n'));
  console.log('\nUpdated .env.local with new price IDs.');
}

async function main() {
  console.log('Setting up Stripe prices...\n');
  const envUpdates = {};

  for (const plan of PLANS) {
    console.log(plan.productName);
    const product = await findOrCreateProduct(plan.productName, plan.productDescription);
    for (const priceDef of plan.prices) {
      const price = await findOrCreatePrice(
        product.id,
        priceDef.amount,
        priceDef.interval,
        priceDef.label,
      );
      envUpdates[priceDef.key] = price.id;
    }
    console.log('');
  }

  updateEnvFile(envUpdates);

  console.log('Add the same vars to Vercel (Production + Preview):');
  for (const [k, v] of Object.entries(envUpdates)) {
    console.log(`  ${k}=${v}`);
  }
  console.log('\nDone. Redeploy after updating Vercel env vars.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

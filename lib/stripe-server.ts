// @ts-nocheck
// Server-side Stripe configuration
// This file should only be used in API routes and server components

import Stripe from 'stripe';

// Initialize Stripe with secret key (server-side only)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy-key-for-build', {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

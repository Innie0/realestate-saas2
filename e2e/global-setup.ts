import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const AUTH_DIR = path.join(__dirname, '.auth');
const CREDENTIALS_FILE = path.join(AUTH_DIR, 'credentials.json');

const DEFAULT_EMAIL = 'e2e-playwright@oikaro.test';
const DEFAULT_PASSWORD = 'E2eTestPassword123!';

export default async function globalSetup() {
  dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

  fs.mkdirSync(AUTH_DIR, { recursive: true });

  const email = process.env.E2E_USER_EMAIL || DEFAULT_EMAIL;
  const password = process.env.E2E_USER_PASSWORD || DEFAULT_PASSWORD;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const proPlanId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;

  if (!supabaseUrl || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  }

  let userId: string | null = null;

  if (process.env.E2E_USER_EMAIL && process.env.E2E_USER_PASSWORD) {
    const anon = createClient(supabaseUrl, anonKey);
    const { data } = await anon.auth.signInWithPassword({ email, password });
    userId = data.user?.id ?? null;
    if (!userId) {
      throw new Error(
        `E2E_USER_EMAIL login failed. Check credentials or set a valid test account in .env.local`,
      );
    }
  } else if (serviceRoleKey) {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: listData, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (listError && listError.message.includes('Invalid API key')) {
      console.warn('[E2E] Service role key invalid — falling back to anon sign-up');
    } else {
      const existing = listData?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

      if (existing) {
        userId = existing.id;
        await admin.auth.admin.updateUserById(userId, { password, email_confirm: true });
      } else {
        const { data: created, error } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: 'E2E Playwright User' },
        });
        if (!error) userId = created.user?.id ?? null;
      }

      if (userId) {
        await admin.from('users').upsert({
          id: userId,
          email,
          full_name: 'E2E Playwright User',
          subscription_status: 'active',
          subscription_plan: proPlanId || null,
          updated_at: new Date().toISOString(),
        });

        await admin.from('agent_settings').upsert(
          {
            user_id: userId,
            auto_followup_enabled: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        );
      }
    }
  }

  if (!userId) {
    const anon = createClient(supabaseUrl, anonKey);
    const signIn = await anon.auth.signInWithPassword({ email, password });
    if (signIn.data.user) {
      userId = signIn.data.user.id;
    } else {
      const signUp = await anon.auth.signUp({
        email,
        password,
        options: { data: { full_name: 'E2E Playwright User' } },
      });
      if (signUp.error) {
        throw new Error(
          `Could not provision E2E user (${signUp.error.message}). Set E2E_USER_EMAIL and E2E_USER_PASSWORD to an active account.`,
        );
      }
      userId = signUp.data.user?.id ?? null;

      if (serviceRoleKey && userId) {
        try {
          const admin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false },
          });
          await admin.from('users').upsert({
            id: userId,
            email,
            full_name: 'E2E Playwright User',
            subscription_status: 'active',
            subscription_plan: proPlanId || null,
          });
          await admin.from('agent_settings').upsert(
            { user_id: userId, auto_followup_enabled: true },
            { onConflict: 'user_id' },
          );
        } catch {
          // Service role may be unavailable — login may still work if user has subscription
        }
      }
    }
  }

  fs.writeFileSync(
    CREDENTIALS_FILE,
    JSON.stringify({ email, password, userId }, null, 2),
  );
}

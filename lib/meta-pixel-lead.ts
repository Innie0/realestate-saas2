'use client';

import { supabase } from '@/lib/supabase';
import { META_PIXEL_ID, trackMetaEvent } from '@/lib/meta-pixel';

/**
 * Report "Lead" the first time an account gets an AI listing description.
 * Remembered on the account (not the browser), so it fires once per user
 * even across devices.
 */
export async function reportFirstListingDescription(): Promise<void> {
  if (!META_PIXEL_ID) return;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.user_metadata?.meta_lead_reported) return;

    trackMetaEvent('Lead');
    await supabase.auth.updateUser({ data: { meta_lead_reported: true } });
  } catch {
    // Tracking must never get in the way of the agent's work
  }
}

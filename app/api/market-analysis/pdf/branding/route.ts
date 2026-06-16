// @ts-nocheck
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import type { CmaPdfBranding } from '@/lib/cma-pdf-types';

const DEFAULT_PRIMARY = '#fc5c03';
const DEFAULT_SECONDARY = '#0369a1';

function safeLogoUrl(url: unknown): string | null {
  if (typeof url !== 'string' || !url.trim()) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return url;
  } catch {
    /* ignore */
  }
  return null;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const [brandResult, agentResult] = await Promise.all([
      supabase.from('brand_kits').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('agent_settings').select('*').eq('user_id', user.id).maybeSingle(),
    ]);

    const brand = brandResult.error ? null : brandResult.data;
    const agent = agentResult.error ? null : agentResult.data;
    const meta = user.user_metadata ?? {};

    const branding: CmaPdfBranding = {
      agentName:
        (typeof meta.full_name === 'string' && meta.full_name) ||
        (typeof meta.name === 'string' && meta.name) ||
        user.email?.split('@')[0] ||
        'Agent',
      agentEmail: agent?.profile_email || user.email || '',
      agentPhone: agent?.profile_phone || null,
      agentHeadline: agent?.profile_headline || null,
      logoUrl: safeLogoUrl(brand?.logo_url),
      primaryColor: brand?.primary_color || DEFAULT_PRIMARY,
      secondaryColor: brand?.secondary_color || DEFAULT_SECONDARY,
    };

    return NextResponse.json({ success: true, data: branding });
  } catch (err) {
    console.error('CMA PDF branding error:', err);
    return NextResponse.json(
      { success: false, error: 'Could not load branding.' },
      { status: 500 }
    );
  }
}

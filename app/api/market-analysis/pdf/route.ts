// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import type { CmaPdfBranding, CmaPdfPayload } from '@/lib/cma-pdf-types';
import { generateCmaPdfBuffer } from '@/lib/cma-pdf-server';

const DEFAULT_PRIMARY = '#fc5c03';
const DEFAULT_SECONDARY = '#0369a1';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sanitizeFilename(address: string): string {
  const base = address
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
  return `CMA-${base || 'report'}.pdf`;
}

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

function isValidPayload(body: unknown): body is CmaPdfPayload {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  return typeof b.address === 'string' && b.subject !== undefined && b.valuation !== undefined;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (!isValidPayload(body)) {
      return NextResponse.json(
        { success: false, error: 'Invalid report data. Run a CMA first.' },
        { status: 400 }
      );
    }

    const report: CmaPdfPayload = {
      ...body,
      generatedAt: body.generatedAt || new Date().toISOString(),
      comps: Array.isArray(body.comps) ? body.comps : [],
    };

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

    const pdfBytes = await generateCmaPdfBuffer(report, branding);
    const filename = sanitizeFilename(report.address);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('CMA PDF export error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to generate PDF: ${message}` },
      { status: 500 }
    );
  }
}

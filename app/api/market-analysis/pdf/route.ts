// @ts-nocheck
import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase-server';
import { CmaPdfDocument } from '@/lib/cma-pdf-document';
import type { CmaPdfBranding, CmaPdfPayload } from '@/lib/cma-pdf-types';

const DEFAULT_PRIMARY = '#fc5c03';
const DEFAULT_SECONDARY = '#0369a1';

function sanitizeFilename(address: string): string {
  const base = address
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
  return `CMA-${base || 'report'}.pdf`;
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

    const brand = brandResult.data;
    const agent = agentResult.data;
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
      logoUrl: brand?.logo_url || null,
      primaryColor: brand?.primary_color || DEFAULT_PRIMARY,
      secondaryColor: brand?.secondary_color || DEFAULT_SECONDARY,
    };

    const pdfBuffer = await renderToBuffer(
      React.createElement(CmaPdfDocument, { report, branding })
    );

    const filename = sanitizeFilename(report.address);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('CMA PDF export error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to generate PDF. Please try again.' },
      { status: 500 }
    );
  }
}

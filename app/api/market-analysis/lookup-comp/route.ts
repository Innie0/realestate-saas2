// Look up a sold listing by address and score it against the CMA subject.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { calculateCma, type SubjectProperty } from '@/lib/cma';
import {
  compAddressFromRaw,
  getCompExclusionReason,
  mapRawComp,
} from '@/lib/comp-filters';
import { fetchSoldListingsByAddress } from '@/lib/comp-lookup';

function getRentcastKey() {
  return process.env.RENTCAST_API_KEY || null;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const key = getRentcastKey();
    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Market analysis is not configured.' },
        { status: 500 },
      );
    }

    const body = await request.json();
    const compAddress = String(body.compAddress ?? '').trim();
    const subjectAddress = String(body.subjectAddress ?? '').trim();
    const subject = body.subject as SubjectProperty | undefined;

    if (!compAddress) {
      return NextResponse.json({ success: false, error: 'Enter a comp address.' }, { status: 400 });
    }
    if (!subjectAddress || !subject) {
      return NextResponse.json(
        { success: false, error: 'Subject property context is required.' },
        { status: 400 },
      );
    }

    const rawListings = await fetchSoldListingsByAddress(compAddress, key, 8);
    if (rawListings.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No sold listing found at that address. Try the full street, city, state, and ZIP.',
        },
        { status: 404 },
      );
    }

    const activeListingAddresses = Array.isArray(body.activeListingAddresses)
      ? (body.activeListingAddresses as string[])
      : [];
    const activeMlsNumbers = Array.isArray(body.activeMlsNumbers)
      ? (body.activeMlsNumbers as string[])
      : [];

    let bestRaw: Record<string, unknown> | null = null;
    let exclusionReason: string | null = null;

    for (const raw of rawListings) {
      const reason = getCompExclusionReason(raw, {
        subjectAddress,
        activeListingAddresses,
        activeMlsNumbers,
      });
      if (!reason) {
        bestRaw = raw;
        break;
      }
      exclusionReason = reason;
    }

    if (!bestRaw) {
      return NextResponse.json(
        {
          success: false,
          error: exclusionReason ?? 'That listing is not a valid closed sale comp.',
        },
        { status: 422 },
      );
    }

    const comp = mapRawComp(bestRaw);
    const { scoredComps } = calculateCma(subject, [comp]);
    const scored = scoredComps[0];
    if (!scored) {
      return NextResponse.json({ success: false, error: 'Could not score that comp.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        comp: {
          ...scored,
          selectedForValuation: true,
          manuallyAdded: true,
        },
        address: compAddressFromRaw(bestRaw),
      },
    });
  } catch (err) {
    console.error('POST /api/market-analysis/lookup-comp:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

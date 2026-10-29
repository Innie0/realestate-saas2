// Meta "Deauthorize Callback URL": Meta calls this when someone removes Oikaro
// from their Facebook settings. We delete the stored connection for that person.
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { parseMetaSignedRequest, readSignedRequest } from '@/lib/ads/meta-signed-request';
import { removeMetaConnection } from '@/lib/ads/meta-data-removal';

export async function POST(request: Request) {
  const payload = parseMetaSignedRequest(await readSignedRequest(request));
  if (!payload) {
    return NextResponse.json({ error: 'Invalid signed_request' }, { status: 400 });
  }

  try {
    await removeMetaConnection(createAdminClient(), payload.user_id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Meta deauthorize error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Could not remove the connection' }, { status: 500 });
  }
}

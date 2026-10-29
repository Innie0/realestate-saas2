// Meta "Data Deletion Request URL": Meta calls this when someone asks Facebook to
// delete the data Oikaro got about them. We delete it right away, record the
// request, and reply with a status link and confirmation code, as Meta requires.
import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { parseMetaSignedRequest, readSignedRequest } from '@/lib/ads/meta-signed-request';
import { deleteAllMetaData } from '@/lib/ads/meta-data-removal';

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://oikaro.com').replace(/\/$/, '');

export async function POST(request: Request) {
  const payload = parseMetaSignedRequest(await readSignedRequest(request));
  if (!payload) {
    return NextResponse.json({ error: 'Invalid signed_request' }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const userIds = await deleteAllMetaData(admin, payload.user_id);
    const confirmationCode = randomBytes(9).toString('hex');

    const { error } = await admin.from('meta_data_deletion_requests').insert({
      confirmation_code: confirmationCode,
      meta_user_id: payload.user_id,
      oikaro_user_ids: userIds,
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
    if (error) console.error('Meta deletion log error:', error.message);

    return NextResponse.json({
      url: `${SITE_URL}/data-deletion?code=${confirmationCode}`,
      confirmation_code: confirmationCode,
    });
  } catch (error) {
    console.error('Meta data deletion error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Could not process the deletion request' }, { status: 500 });
  }
}

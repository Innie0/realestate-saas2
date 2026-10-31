// Serves one photo of a listing an agent chose to show on their public profile.
// Older projects stored photos inline (data URLs); sending those through this
// small route keeps the profile page light and lets browsers cache each photo.
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { normalizeProjectImages } from '@/lib/listing-utils';

const UUID = /^[0-9a-f-]{36}$/i;

export async function GET(_req: Request, { params }: { params: Promise<{ projectId: string; index: string }> }) {
  const { projectId, index } = await params;
  const i = Number(index);
  if (!UUID.test(projectId) || !Number.isInteger(i) || i < 0 || i > 50) {
    return new NextResponse('Not found', { status: 404 });
  }

  const { data } = await createAdminClient()
    .from('projects')
    .select('images, profile_status')
    .eq('id', projectId)
    .maybeSingle();

  // Only photos of listings the agent made public
  if (!data?.profile_status) return new NextResponse('Not found', { status: 404 });

  const src = normalizeProjectImages(data.images)[i];
  if (!src) return new NextResponse('Not found', { status: 404 });

  if (/^https?:\/\//i.test(src)) return NextResponse.redirect(src, 302);

  const match = /^data:(image\/(?:jpeg|jpg|png|webp|gif|avif));base64,(.+)$/i.exec(src);
  if (!match) return new NextResponse('Not found', { status: 404 });

  return new NextResponse(Buffer.from(match[2], 'base64'), {
    headers: {
      'Content-Type': match[1].toLowerCase().replace('image/jpg', 'image/jpeg'),
      // Short browser cache so hiding a listing takes effect quickly
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * POST /api/ads/upload-creative
 * Upload ad creative images (multipart: file, draftId)
 */
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const draftId = String(formData.get('draftId') || 'draft').replace(/[^a-zA-Z0-9-]/g, '');

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ success: false, error: 'File must be an image' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const rawExt = file.name.split('.').pop()?.toLowerCase();
    const fileExt =
      rawExt && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(rawExt)
        ? rawExt === 'jpeg'
          ? 'jpg'
          : rawExt
        : file.type === 'image/webp'
          ? 'webp'
          : file.type === 'image/png'
            ? 'png'
            : 'jpg';
    const fileName = `${user.id}/ads/${draftId}/${timestamp}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error } = await supabase.storage.from('property-images').upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      console.error('Ad creative upload error:', error);
      return NextResponse.json({ success: false, error: 'Failed to upload image' }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from('property-images').getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
    });
  } catch (error: any) {
    console.error('upload-creative error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}

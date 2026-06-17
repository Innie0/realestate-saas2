// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
]);

const MAX_BYTES = 50 * 1024 * 1024; // 50MB

const VALID_CONTRACT_TYPES = new Set([
  'purchase_agreement',
  'listing_agreement',
  'lease_agreement',
  'offer',
  'counter_offer',
  'addendum',
  'disclosure',
  'inspection',
  'other',
]);

async function verifyTransaction(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, transactionId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('id')
    .eq('id', transactionId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return { ok: false as const, status: 500, error: error.message };
  if (!data) return { ok: false as const, status: 404, error: 'Transaction not found' };
  return { ok: true as const };
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: transactionId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const check = await verifyTransaction(supabase, user.id, transactionId);
    if (!check.ok) {
      return NextResponse.json({ success: false, error: check.error }, { status: check.status });
    }

    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('transaction_id', transactionId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      if (/relation .* does not exist/i.test(error.message)) {
        return NextResponse.json({
          success: false,
          error: 'Documents storage is not set up yet. Run supabase-contracts-schema.sql in Supabase.',
        }, { status: 503 });
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (err) {
    console.error('GET documents error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: transactionId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const check = await verifyTransaction(supabase, user.id, transactionId);
    if (!check.ok) {
      return NextResponse.json({ success: false, error: check.error }, { status: check.status });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = (formData.get('title') as string | null)?.trim();
    const contractType = (formData.get('contract_type') as string | null)?.trim() || 'other';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({
        success: false,
        error: 'File type not allowed. Upload PDF, Word, JPEG, or PNG.',
      }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ success: false, error: 'File must be under 50MB' }, { status: 400 });
    }

    if (!VALID_CONTRACT_TYPES.has(contractType)) {
      return NextResponse.json({ success: false, error: 'Invalid document type' }, { status: 400 });
    }

    const safeName = sanitizeFileName(file.name || 'document');
    const storagePath = `${user.id}/${transactionId}/${Date.now()}-${safeName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from('contracts')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      const msg = uploadError.message?.includes('Bucket not found')
        ? 'Storage bucket missing. Run supabase-contracts-schema.sql in Supabase.'
        : uploadError.message || 'Failed to upload file';
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }

    const docTitle = title || safeName.replace(/_/g, ' ');

    const { data: contract, error: insertError } = await supabase
      .from('contracts')
      .insert({
        user_id: user.id,
        transaction_id: transactionId,
        title: docTitle,
        file_name: file.name,
        file_path: storagePath,
        file_size: file.size,
        file_type: file.type,
        contract_type: contractType,
        status: 'draft',
      })
      .select()
      .single();

    if (insertError) {
      await supabase.storage.from('contracts').remove([storagePath]);
      console.error('Contract insert error:', insertError);
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: contract }, { status: 201 });
  } catch (err) {
    console.error('POST document error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> },
) {
  try {
    const { id: transactionId, documentId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: doc, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', documentId)
      .eq('transaction_id', transactionId)
      .eq('user_id', user.id)
      .single();

    if (error || !doc) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    const { data: signed, error: signError } = await supabase.storage
      .from('contracts')
      .createSignedUrl(doc.file_path, 3600);

    if (signError || !signed?.signedUrl) {
      return NextResponse.json({ success: false, error: 'Could not generate download link' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...doc,
        download_url: signed.signedUrl,
      },
    });
  } catch (err) {
    console.error('GET document download error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> },
) {
  try {
    const { id: transactionId, documentId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: doc, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', documentId)
      .eq('transaction_id', transactionId)
      .eq('user_id', user.id)
      .single();

    if (error || !doc) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }

    await supabase.storage.from('contracts').remove([doc.file_path]);

    const { error: deleteError } = await supabase
      .from('contracts')
      .delete()
      .eq('id', documentId)
      .eq('user_id', user.id);

    if (deleteError) {
      return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE document error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

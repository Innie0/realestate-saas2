// @ts-nocheck
// GET /api/projects/[id]/transaction-prefill — canonical prefill for new transactions
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { buildProjectTransactionPrefill } from '@/lib/project-transaction-prefill';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const { data: project, error } = await supabase
      .from('projects')
      .select('id, title, property_type, property_info, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: buildProjectTransactionPrefill(project),
    });
  } catch (error) {
    console.error('Error in GET /api/projects/[id]/transaction-prefill:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}

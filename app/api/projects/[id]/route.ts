// @ts-nocheck
// Individual project API route - GET, PUT, DELETE
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { syncProjectListingPriceToTransactions } from '@/lib/project-transaction-sync';

/**
 * GET /api/projects/[id]
 * Fetch a single project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const projectId = id;

    // Fetch project
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (error || !project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    const { data: linkedTransactions } = await supabase
      .from('transactions')
      .select('id, status, property_address, offer_price, closing_date, buyer_name, created_at')
      .eq('user_id', user.id)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      success: true,
      data: {
        ...project,
        linked_transactions: linkedTransactions ?? [],
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/projects/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects/[id]
 * Update a project
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const projectId = id;
    const body = await request.json();

    // Verify ownership
    const { data: existingProject, error: fetchError } = await supabase
      .from('projects')
      .select('id, property_info')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingProject) {
      return NextResponse.json(
        { success: false, error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Update project - only update fields that are provided in the request
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Only include fields that are explicitly provided
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.property_type !== undefined) updateData.property_type = body.property_type;
    if (body.property_info !== undefined) updateData.property_info = body.property_info;
    if (body.images !== undefined) updateData.images = body.images;
    if (body.ai_content !== undefined) updateData.ai_content = body.ai_content;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.selected_tone !== undefined) updateData.selected_tone = body.selected_tone;
    if (body.tone_versions !== undefined) updateData.tone_versions = body.tone_versions;

    const { data: project, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update project' },
        { status: 500 }
      );
    }

    const previousPrice = existingProject?.property_info?.price;
    const nextPrice = body.property_info?.price;
    if (
      body.property_info !== undefined &&
      typeof nextPrice === 'number' &&
      nextPrice > 0 &&
      nextPrice !== previousPrice
    ) {
      await syncProjectListingPriceToTransactions(supabase, user.id, projectId, nextPrice);
    }

    return NextResponse.json({
      success: true,
      data: project,
      message: 'Project updated successfully',
    });
  } catch (error: any) {
    console.error('Error in PUT /api/projects/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete a project
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const projectId = id;

    // Delete project
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting project:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete project' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/projects/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

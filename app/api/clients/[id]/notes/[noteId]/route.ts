// API route for individual note - PUT and DELETE
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * PUT /api/clients/[id]/notes/[noteId]
 * Update a specific note
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    const supabase = createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const noteId = params.noteId;
    const body = await request.json();
    const { note } = body;

    if (!note || !note.trim()) {
      return NextResponse.json(
        { success: false, error: 'Note content is required' },
        { status: 400 }
      );
    }

    // Update note (verify it belongs to the user)
    const { data, error } = await supabase
      .from('client_notes')
      .update({ note: note.trim() })
      .eq('id', noteId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating note:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update note' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Note updated successfully',
      data,
    });
  } catch (error) {
    console.error('Error in PUT /api/clients/[id]/notes/[noteId]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/clients/[id]/notes/[noteId]
 * Delete a specific note
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    const supabase = createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const noteId = params.noteId;

    // Delete note (verify it belongs to the user)
    const { error } = await supabase
      .from('client_notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting note:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete note' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/clients/[id]/notes/[noteId]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


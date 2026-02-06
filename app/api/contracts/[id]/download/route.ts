// @ts-nocheck
// Contract Download API Route
// Handles downloading contract files

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * GET /api/contracts/[id]/download
 * Download a contract file
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get contract
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('file_path, file_name, file_type')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Get signed URL for file download
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('contracts')
      .createSignedUrl(contract.file_path, 60); // 60 second expiry

    if (urlError || !signedUrlData) {
      console.error('[Contract Download] Error creating signed URL:', urlError);
      return NextResponse.json(
        { error: 'Failed to generate download URL' },
        { status: 500 }
      );
    }

    // Return the signed URL
    return NextResponse.json({
      url: signedUrlData.signedUrl,
      file_name: contract.file_name,
      file_type: contract.file_type,
    });
  } catch (error: any) {
    console.error('[Contract Download] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

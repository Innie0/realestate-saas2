// @ts-nocheck
// Projects API route - Handle project CRUD operations
// GET: List all projects, POST: Create new project

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { APIResponse } from '@/types';

/**
 * GET handler - Retrieve all projects for the current user
 * Query params: limit (optional) - limit the number of projects returned
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    // OPTIMIZED: Only select fields needed for the project list view
    // Includes images for thumbnails, but excludes heavy data like ai_content
    let query = supabase
      .from('projects')
      .select('id, title, description, status, property_type, property_info, images, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Apply limit if specified
    if (limit && limit > 0) {
      query = query.limit(limit);
    }

    const { data: projects, error } = await query;

    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch projects' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: projects || [],
    });
  } catch (error: any) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve projects' },
      { status: 500 }
    );
  }
}

/**
 * POST handler - Create a new project
 * Body should contain: title, description, property_type, property_info
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { title, description, property_type, property_info } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    // Create project in database
    const { data: newProject, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        title,
        description: description || null,
        property_type: property_type || null,
        property_info: property_info || {},
        images: [],
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create project' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newProject,
      message: 'Project created successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create project error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create project' },
      { status: 500 }
    );
  }
}


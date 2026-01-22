// Dashboard statistics API route
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * GET /api/dashboard/stats
 * Fetch real-time dashboard statistics for the authenticated user
 */
export async function GET(request: NextRequest) {
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

    // OPTIMIZED: Get total project count using Supabase count (no data loading)
    const { count: totalProjects, error: countError } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      console.error('Error fetching project count:', countError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch statistics' },
        { status: 500 }
      );
    }

    // Get counts from last month for comparison
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const { count: projectsThisMonth } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', oneMonthAgo.toISOString());

    // OPTIMIZED: Only fetch minimal data (images and ai_content fields) for counting
    // This is much faster than loading full project data
    const { data: projectsForCounting, error: projectsError } = await supabase
      .from('projects')
      .select('images, ai_content')
      .eq('user_id', user.id);

    if (projectsError) {
      console.error('Error fetching projects for counting:', projectsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch statistics' },
        { status: 500 }
      );
    }

    // Count total images across all projects
    const totalImages = projectsForCounting?.reduce((sum, project) => {
      const images = project.images || [];
      return sum + (Array.isArray(images) ? images.length : 0);
    }, 0) || 0;

    // Count projects with AI-generated content
    const aiContentCount = projectsForCounting?.filter(project => {
      return project.ai_content && Object.keys(project.ai_content).length > 0;
    }).length || 0;

    // Get counts from last week for comparison
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: lastWeekProjects } = await supabase
      .from('projects')
      .select('images, ai_content')
      .eq('user_id', user.id)
      .gte('created_at', oneWeekAgo.toISOString());

    // Count images from last week
    const imagesThisWeek = lastWeekProjects?.reduce((sum, project) => {
      const images = project.images || [];
      return sum + (Array.isArray(images) ? images.length : 0);
    }, 0) || 0;

    // Count AI content from last week
    const aiContentThisWeek = lastWeekProjects?.filter(project => {
      return project.ai_content && Object.keys(project.ai_content).length > 0;
    }).length || 0;

    return NextResponse.json({
      success: true,
      data: {
        totalProjects: totalProjects || 0,
        projectsThisMonth: projectsThisMonth || 0,
        totalImages,
        imagesThisWeek,
        aiContentCount,
        aiContentThisWeek,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/dashboard/stats:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}










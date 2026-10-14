// @ts-nocheck
// AI Image Analysis API Route
// Analyzes property images using OpenAI Vision API

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { analyzePropertyImages } from '@/lib/openai';
import { consumeDailyAiAllowance, DAILY_AI_CAP_MESSAGE } from '@/lib/usage';

/**
 * POST /api/ai/analyze-image
 * Analyze property images using AI vision
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

    if (!(await consumeDailyAiAllowance(supabase, user.id, 'ai_listing'))) {
      return NextResponse.json({ success: false, error: DAILY_AI_CAP_MESSAGE }, { status: 429 });
    }

    const body = await request.json();
    const { images } = body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No images provided' },
        { status: 400 }
      );
    }

    // Limit to 10 images to control costs
    const imagesToAnalyze = images.slice(0, 10);

    console.log(`Analyzing ${imagesToAnalyze.length} images with OpenAI Vision...`);

    // Call OpenAI to analyze all images
    const result = await analyzePropertyImages(imagesToAnalyze);

    if (!result.success) {
      throw new Error(result.error || 'Image analysis failed');
    }

    console.log('Image analysis complete:', {
      totalImages: imagesToAnalyze.length,
      analyzedImages: result.analyses?.length || 0,
      roomTypes: Object.keys(result.byRoomType || {}),
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `Successfully analyzed ${result.analyses?.length || 0} images`,
    });
  } catch (error: any) {
    console.error('Error in POST /api/ai/analyze-image:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to analyze images',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

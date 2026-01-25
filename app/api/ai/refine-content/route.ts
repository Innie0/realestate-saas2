// AI Content Refinement API
// Refines existing property descriptions based on user instructions using OpenAI

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import OpenAI from 'openai';

/**
 * POST /api/ai/refine-content
 * Refines property description based on user instructions
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize OpenAI client (lazy initialization to avoid build-time errors)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build',
    });

    const supabase = createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentDescription, instructions, propertyInfo, tone } = body;

    if (!currentDescription || !instructions) {
      return NextResponse.json(
        { success: false, error: 'Current description and instructions are required' },
        { status: 400 }
      );
    }

    console.log(`Refining description with instructions: ${instructions}`);

    // Tone descriptions
    const toneGuide = {
      professional: 'Maintain a formal, business-appropriate tone ideal for MLS listings',
      casual: 'Use a warm, approachable, conversational tone perfect for social media',
      luxury: 'Employ elegant, sophisticated language for high-end properties',
    };

    const prompt = `You are a professional real estate copywriter. Your task is to refine the following property description based on the user's specific instructions.

CURRENT DESCRIPTION:
${currentDescription}

USER'S REFINEMENT INSTRUCTIONS:
${instructions}

PROPERTY DETAILS (for reference):
- Property Type: ${propertyInfo?.propertyType || propertyInfo?.property_type || 'Not specified'}
- Bedrooms: ${propertyInfo?.bedrooms || 'Not specified'}
- Bathrooms: ${propertyInfo?.bathrooms || 'Not specified'}
- Square Feet: ${propertyInfo?.square_feet || propertyInfo?.squareFeet || 'Not specified'}

TONE: ${tone || 'professional'}
${toneGuide[tone as keyof typeof toneGuide] || toneGuide.professional}

REQUIREMENTS:
1. Apply the user's instructions EXACTLY as requested
2. Maintain the ${tone || 'professional'} tone throughout
3. Keep the description length similar (300-350 words, 2-3 paragraphs)
4. Use single line breaks between paragraphs (no extra spacing)
5. DO NOT include:
   - Specific street address
   - City or neighborhood names
   - Price or dollar amounts
   - Square footage numbers
   - Furniture or staging items
6. Focus on permanent features: architecture, materials, finishes, appliances, fixtures
7. Group features logically by area (entry, living spaces, kitchen, bedrooms, outdoor)
8. Use luxury descriptors: magnificent, stunning, spectacular, remarkable, splendid

Return ONLY the refined description text with no additional commentary or explanations.`;

    // Call OpenAI to refine the content
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert real estate copywriter specializing in luxury property descriptions. You follow instructions precisely while maintaining professional quality.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const refinedDescription = completion.choices[0]?.message?.content?.trim();

    if (!refinedDescription) {
      throw new Error('No refined description generated');
    }

    console.log(`Refinement complete: ${refinedDescription.length} characters`);

    return NextResponse.json({
      success: true,
      refinedDescription,
      message: 'Content refined successfully',
    });
  } catch (error: any) {
    console.error('AI refinement error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to refine content',
        details: error.response?.data || error.toString(),
      },
      { status: 500 }
    );
  }
}




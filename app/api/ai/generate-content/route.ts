// AI Content Generation API Route
// Generates property descriptions using OpenAI

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { openai } from '@/lib/openai';

/**
 * POST /api/ai/generate-content
 * Generate property marketing content using OpenAI
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

    const body = await request.json();
    const { propertyInfo, imageAnalysis, tone } = body;

    if (!propertyInfo) {
      return NextResponse.json(
        { success: false, error: 'Property information is required' },
        { status: 400 }
      );
    }

    console.log(`Generating ${tone || 'professional'} tone content with OpenAI...`);

    // Build context from image analysis
    let imageContext = '';
    if (imageAnalysis?.byRoomType) {
      imageContext = '\n\nImage Analysis Results:\n';
      Object.entries(imageAnalysis.byRoomType).forEach(([roomType, analyses]: [string, any]) => {
        imageContext += `\n${roomType.toUpperCase()}:\n`;
        analyses.forEach((analysis: any, idx: number) => {
          if (analysis.features && analysis.features.length > 0) {
            imageContext += `  - Features: ${analysis.features.join(', ')}\n`;
          }
          if (analysis.styleDescription) {
            imageContext += `  - Style: ${analysis.styleDescription}\n`;
          }
        });
      });
    }

    // Define tone-specific instructions
    const toneInstructions = {
      professional: 'Write in a refined, descriptive tone suitable for high-end MLS listings. Use specific materials and brand names. Create a flowing narrative that walks through the home. Use phrases like "masterfully crafted", "captivates with", "showcases", "features". Be detailed and elegant.',
      casual: 'Write in a warm, enthusiastic tone while maintaining the flowing narrative style. Use conversational language like "you\'ll notice", "perfect for", "gives you". Still be descriptive but more relatable. Keep the single-paragraph structure.',
      luxury: 'Write in the most elegant, sophisticated tone possible. Use phrases like "masterfully crafted", "captivates with", "evokes pure tranquility", "drenched in the finest materials". Emphasize exclusivity, craftsmanship, and unparalleled quality. Be extremely descriptive with materials and finishes.',
    };

    const selectedTone = tone as keyof typeof toneInstructions || 'professional';

    // Create comprehensive prompt
    const prompt = `Generate a compelling property description for a real estate listing.

PROPERTY DETAILS:
- Address: ${propertyInfo.address || 'Not specified'}
- City: ${propertyInfo.city || 'Not specified'}
- State: ${propertyInfo.state || 'Not specified'}
- Property Type: ${propertyInfo.propertyType || propertyInfo.property_type || 'Not specified'}
- Bedrooms: ${propertyInfo.bedrooms || 'Not specified'}
- Bathrooms: ${propertyInfo.bathrooms || 'Not specified'}
- Square Feet: ${propertyInfo.square_feet || propertyInfo.squareFeet || 'Not specified'}
- Lot Size: ${propertyInfo.lot_size || 'Not specified'}
- Year Built: ${propertyInfo.year_built || 'Not specified'}
- Price: ${propertyInfo.price ? `$${propertyInfo.price.toLocaleString()}` : 'Not specified'}
- Features: ${propertyInfo.features?.join(', ') || 'Not specified'}
${imageContext}

TONE: ${selectedTone}
${toneInstructions[selectedTone]}

REQUIREMENTS:
1. Write a detailed, flowing property description (300-350 words) in 2-3 well-structured paragraphs
2. Follow this exact structure:
   
   PARAGRAPH 1 (Opening + Interior):
   - Opening statement establishing ambiance and bedroom/bath count
   - Entry/foyer details if visible in images
   - Main living areas and interior architectural features
   - Kitchen with specific appliances, materials, and finishes (use brand names if visible)
   
   PARAGRAPH 2 (Bedrooms + Outdoor):
   - Upper level/bedrooms with specific details about flooring, closets, views
   - Outdoor spaces with specific amenities and landscaping
   
   PARAGRAPH 3 (Closing):
   - Strong closing statement emphasizing luxury and opportunity
   - (Optional: combine with paragraph 2 if outdoor section is short)

3. Use the EXACT writing style:
   - Rich, descriptive language with specific materials (marble, limestone, wood species)
   - Brand names when visible (Wolf, SubZero, etc.)
   - Detailed descriptions of each feature ("wrought iron lined grand staircase", "glass fronted SubZero fridge")
   - Create a flowing narrative that takes the reader through the home
   - Use phrases like "captivates with", "evokes pure tranquility", "drenched in the finest"
4. Be VERY specific about materials, finishes, and appliances seen in images
5. Use luxury descriptors: magnificent, stunning, spectacular, remarkable, splendid
6. Describe the experience and feeling of each space
7. DO NOT make up details - only describe what's in the images or property info

CRITICAL - DO NOT INCLUDE:
- DO NOT mention the specific street address
- DO NOT mention the city or neighborhood names  
- DO NOT mention the price or any dollar amounts
- DO NOT mention square footage numbers
- DO NOT mention furniture, staging items, or temporary decorations
- DO NOT mention sofas, chairs, tables, beds, artwork, rugs, lamps, or any furnishings
- Focus ONLY on permanent features: architecture, built-ins, appliances, fixtures, finishes, materials
- You may reference "prime location" or "exclusive neighborhood" generically
- Focus on materials, features, brands, and lifestyle experience

FORMAT: Return as 2-3 paragraphs separated by single line breaks (\n) with no extra spacing. Each paragraph should flow naturally and maintain the luxury narrative style.

Return your response as plain text (the description only, no extra formatting).`;

    // Call OpenAI to generate the description
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert real estate copywriter who creates compelling, accurate property descriptions that sell homes.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const description = completion.choices[0]?.message?.content;

    if (!description) {
      throw new Error('No content generated by AI');
    }

    console.log(`Generated ${description.length} character description`);

    return NextResponse.json({
      success: true,
      data: {
        description: description.trim(),
        tone: selectedTone,
      },
    });
  } catch (error: any) {
    console.error('Error in POST /api/ai/generate-content:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to generate content',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

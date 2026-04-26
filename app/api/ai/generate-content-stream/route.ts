// @ts-nocheck
// Streaming AI Content Generation Route
// Streams the property description token-by-token for typewriter effect

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { openai } from '@/lib/openai';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = await request.json();
  const { propertyInfo, imageAnalysis, tone } = body;

  if (!propertyInfo) {
    return new Response(JSON.stringify({ error: 'Property information is required' }), { status: 400 });
  }

  // Build image context
  let imageContext = '';
  if (imageAnalysis?.byRoomType) {
    imageContext = '\n\nImage Analysis Results:\n';
    Object.entries(imageAnalysis.byRoomType).forEach(([roomType, analyses]: [string, any]) => {
      imageContext += `\n${roomType.toUpperCase()}:\n`;
      analyses.forEach((analysis: any) => {
        if (analysis.features?.length > 0) imageContext += `  - Features: ${analysis.features.join(', ')}\n`;
        if (analysis.styleDescription) imageContext += `  - Style: ${analysis.styleDescription}\n`;
      });
    });
  }

  const toneInstructions: Record<string, string> = {
    professional: 'Write in a refined, descriptive tone suitable for high-end MLS listings. Use specific materials and brand names. Create a flowing narrative that walks through the home.',
    casual: 'Write in a warm, enthusiastic tone. Use conversational language like "you\'ll notice", "perfect for", "gives you". Still be descriptive but more relatable.',
    luxury: 'Write in the most elegant, sophisticated tone possible. Use phrases like "masterfully crafted", "captivates with", "evokes pure tranquility". Emphasize exclusivity and craftsmanship.',
  };

  const selectedTone = (tone as string) || 'professional';
  const toneInstruction = toneInstructions[selectedTone] || toneInstructions.professional;

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
${toneInstruction}

REQUIREMENTS:
1. Write a detailed, flowing property description (300-350 words) in 2-3 well-structured paragraphs
2. Rich, descriptive language with specific materials
3. DO NOT mention the street address, city, price, or square footage numbers
4. Focus ONLY on permanent features: architecture, built-ins, appliances, fixtures, finishes
5. FORMAT: Return as 2-3 paragraphs separated by single line breaks with no extra spacing

Return plain text only (no extra formatting).`;

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are an expert real estate copywriter who creates compelling, accurate property descriptions that sell homes.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 800,
    stream: true,
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || '';
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  });
}

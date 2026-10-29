import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { openai } from '@/lib/openai';
import { consumeDailyAiAllowance, DAILY_AI_CAP_MESSAGE } from '@/lib/usage';
import { sanitizeAdIdeaReview } from '@/lib/ads/ad-idea';
import { platformsAvailableFor } from '@/lib/ads/ad-type-config';

const MAX_IDEA_CHARS = 600;

/**
 * POST /api/ai/evaluate-ad-idea
 * Review an agent's own ad idea: is it likely to work, where should it run, what
 * are the risks, and a ready-to-use Google version. Body: { idea, city?, state? }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const idea = typeof body.idea === 'string' ? body.idea.trim().slice(0, MAX_IDEA_CHARS) : '';
    const city = typeof body.city === 'string' ? body.city.trim().slice(0, 60) : '';
    const state = typeof body.state === 'string' ? body.state.trim().slice(0, 30) : '';
    if (idea.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Describe your idea in a sentence or two.' },
        { status: 400 },
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'AI review isn’t available right now.' },
        { status: 503 },
      );
    }

    // The server client's generated types don't line up with the generic one usage.ts takes
    const usageClient = supabase as unknown as Parameters<typeof consumeDailyAiAllowance>[0];
    if (!(await consumeDailyAiAllowance(usageClient, user.id, 'ai_ads'))) {
      return NextResponse.json({ success: false, error: DAILY_AI_CAP_MESSAGE }, { status: 429 });
    }

    const location = [city, state].filter(Boolean).join(', ') || 'not given';
    const prompt = `You are an experienced real estate advertising strategist reviewing a US real estate agent's own ad idea before they spend money on it. Be honest and practical: the agent pays for every click.

The agent's idea: """${idea}"""
Agent's market: ${location}
Platforms: Google Search ads (people actively searching) are available now. Facebook & Instagram ads (people scrolling) are ${platformsAvailableFor(user.email).meta ? 'available' : 'coming soon, not available yet'}.

Judge the idea on:
- Will it bring in leads (people who could become clients) for a reasonable cost? Brand-only or vanity ideas are usually weak.
- Do people actually search Google for this? If not, a Google Search ad won't work and google.suitable must be false.
- Fair-housing rules: no targeting or describing who should live somewhere (family status, age, religion, race, national origin, disability, sex), no claims that an area is safer or better.
- MLS rules: advertising a home publicly before it's on the MLS ("coming soon", "pocket listing") can break MLS rules.
- Unprovable claims ("best", "#1", "guaranteed") get ads rejected.

Return ONLY JSON with exactly these keys:
{
  "verdict": "strong" | "okay" | "weak",
  "summary": "one specific sentence about THIS idea: who it reaches, whether they act on it, and so whether it will pay off — never vague like 'needs refinement'",
  "reasons": ["up to 3 short, specific reasons tied to this idea"],
  "risks": ["up to 3 specific compliance or policy risks, or an empty array"],
  "bestPlatform": "google" | "meta" | "either",
  "platformReason": "one short sentence",
  "improvedIdea": "a sharper, compliant version that keeps the agent's intent, in one or two sentences, with no exclamation marks",
  "google": {
    "suitable": true | false,
    "headline": "a Google headline, max 30 characters, no exclamation marks",
    "message": "a Google description, max 90 characters",
    "keywords": ["3 to 8 search phrases real people type, including the city when given; no ages, family status, religion, or other protected traits"]
  }
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    let parsed: unknown = null;
    try {
      parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
    } catch {
      parsed = null;
    }
    const review = sanitizeAdIdeaReview(parsed);
    if (!review) {
      return NextResponse.json(
        { success: false, error: 'The AI review didn’t come back right. Please try again.' },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true, data: review });
  } catch (error) {
    console.error('Evaluate ad idea error:', error);
    return NextResponse.json(
      { success: false, error: 'Could not review your idea. Please try again.' },
      { status: 500 },
    );
  }
}

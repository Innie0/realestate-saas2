export const HERO_INPUT_PLACEHOLDERS = [
  'Ask AI to find your next lead...',
  'Ask AI to write a listing description...',
  'Ask AI to run a CMA on an address...',
  'Ask AI to draft a follow-up email...',
] as const;

export const HERO_QUICK_ACTIONS = [
  {
    label: 'Generate a Listing',
    prompt:
      'Generate a compelling MLS listing description for a 3-bedroom, 2-bathroom home in Austin, TX.',
  },
  {
    label: 'Find Leads',
    prompt:
      'Review my leads inbox and suggest follow-up steps for my hottest prospects.',
  },
  {
    label: 'Run a CMA',
    prompt: 'Run a comparative market analysis for 742 Oak Street, Austin, TX 78701.',
  },
] as const;

export const HERO_TRUST_BRANDS = [
  'Keller Williams',
  'RE/MAX',
  'Compass',
  'eXp Realty',
  'Coldwell Banker',
  'Century 21',
] as const;

export function persistHeroPrompt(prompt: string) {
  try {
    sessionStorage.setItem('oikaro_pending_ai_prompt', prompt);
  } catch {
    // ignore storage failures
  }
}

export function consumeHeroPrompt(): string | null {
  try {
    const value = sessionStorage.getItem('oikaro_pending_ai_prompt');
    if (value) sessionStorage.removeItem('oikaro_pending_ai_prompt');
    return value;
  } catch {
    return null;
  }
}

// Builds the public "Find an Agent" directory — the list of agents who have
// enabled their public profile and currently have Pro-tier lead-tools
// access. Used by the /agents directory page and by the sitemap so agent
// pages are actually discoverable by search engines.

import { createAdminClient } from '@/lib/supabase-admin';
import { hasProLeadToolsAccess } from '@/lib/subscription';
import { buildAgentProfilePath } from '@/lib/agent-profile-shared';

export interface PublicAgentSummary {
  id: string;
  name: string;
  path: string;
  headline: string;
  bio: string;
  photoUrl: string;
  specialties: string[];
  areas: string[];
  brokerage: string;
  yearsExperience: number | null;
}

const UNASSIGNED_AREA = 'Other areas';

export async function getPublicAgentDirectory(): Promise<PublicAgentSummary[]> {
  const supabase = createAdminClient();

  const { data: rows, error } = await supabase
    .from('agent_settings')
    .select(
      `
      user_id,
      profile_headline,
      profile_bio,
      profile_photo_url,
      profile_specialties,
      profile_areas,
      profile_brokerage,
      profile_years_experience,
      users:user_id ( full_name, email, subscription_plan, subscription_status )
    `
    )
    .eq('profile_enabled', true);

  if (error || !rows) {
    if (error) console.error('getPublicAgentDirectory error:', error.message);
    return [];
  }

  const agents: PublicAgentSummary[] = [];

  for (const row of rows as any[]) {
    const user = Array.isArray(row.users) ? row.users[0] : row.users;
    if (!user) continue;

    if (!hasProLeadToolsAccess(user.subscription_status, user.subscription_plan, user.email)) {
      continue;
    }

    const name = user.full_name || 'Agent';
    agents.push({
      id: row.user_id,
      name,
      path: buildAgentProfilePath(name, row.user_id),
      headline: row.profile_headline || '',
      bio: row.profile_bio || '',
      photoUrl: row.profile_photo_url || '',
      specialties: row.profile_specialties || [],
      areas: row.profile_areas || [],
      brokerage: row.profile_brokerage || '',
      yearsExperience: row.profile_years_experience ?? null,
    });
  }

  return agents.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Group agents by the areas they serve so the directory can be browsed by
 * location — the same shape a "real estate agents in [city]" search intent
 * expects. Agents with no area set fall into a shared "Other areas" bucket.
 */
export function groupAgentsByArea(
  agents: PublicAgentSummary[]
): { area: string; agents: PublicAgentSummary[] }[] {
  const map = new Map<string, PublicAgentSummary[]>();

  for (const agent of agents) {
    const areas = agent.areas.length > 0 ? agent.areas : [UNASSIGNED_AREA];
    for (const rawArea of areas) {
      const area = rawArea.trim() || UNASSIGNED_AREA;
      if (!map.has(area)) map.set(area, []);
      map.get(area)!.push(agent);
    }
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => {
      if (a === UNASSIGNED_AREA) return 1;
      if (b === UNASSIGNED_AREA) return -1;
      return a.localeCompare(b);
    })
    .map(([area, areaAgents]) => ({ area, agents: areaAgents }));
}

// Shared helpers for building an agent's public profile URL slug.
// Used by the settings API (to show the agent their shareable link), the
// public listing page (to link back to the listing agent), the agent
// directory, and the sitemap — kept in one place so the slug format never
// drifts between them.

/**
 * Turn a display name into a URL-safe slug, e.g. "Jane O'Neil" -> "jane-o-neil".
 */
export function slugifyAgentName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Build the public profile path for an agent, e.g. /agent/jane-oneil--<uuid>.
 * Falls back to a bare /agent/<uuid> path if the agent has no name on file.
 */
export function buildAgentProfilePath(name: string, userId: string): string {
  const slug = name ? slugifyAgentName(name) : '';
  return slug ? `/agent/${slug}--${userId}` : `/agent/${userId}`;
}

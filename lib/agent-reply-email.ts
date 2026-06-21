/** Resolve where lead replies to auto follow-up emails should be routed. */
export function resolveAgentReplyEmail(options: {
  profileEmail?: string | null;
  authEmail?: string | null;
}): string | undefined {
  const email = (options.profileEmail?.trim() || options.authEmail?.trim() || '').toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return undefined;
  }
  return email;
}

export function formatReplyToHeader(email: string, agentName?: string | null): string {
  const name = agentName?.trim();
  if (name) {
    return `${name} <${email}>`;
  }
  return email;
}

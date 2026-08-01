type SupabaseLike = { from: (table: string) => any };

export type LeadSequenceSummary = {
  enrollment_id?: string;
  status?: string;
  temperature_at_enroll?: string;
  followup_active: boolean;
  awaiting_approval: boolean;
  lead_read?: string | null;
  recommended_tone?: string | null;
  next_step?: {
    id: string;
    step_index: number;
    step_type: string;
    status: string;
    due_at: string;
    subject?: string | null;
    body?: string | null;
  } | null;
};

export async function fetchLeadSequenceSummaries(
  supabase: SupabaseLike,
  agentId: string,
  clientIds: string[],
): Promise<Map<string, LeadSequenceSummary>> {
  const map = new Map<string, LeadSequenceSummary>();
  if (clientIds.length === 0) return map;

  const { data: enrollments, error } = await supabase
    .from('lead_sequence_enrollments')
    .select(`
      id, client_id, status, temperature_at_enroll,
      lead_sequence_step_instances (
        id, step_index, step_type, status, due_at, subject, body
      )
    `)
    .eq('agent_user_id', agentId)
    .in('client_id', clientIds)
    .in('status', ['active', 'paused']);

  if (error) {
    return map;
  }

  const insightClientIds = clientIds;
  const { data: insights } = await supabase
    .from('lead_ai_insights')
    .select('client_id, lead_read, recommended_tone')
    .eq('agent_user_id', agentId)
    .in('client_id', insightClientIds);

  const insightByClient = new Map<string, { lead_read: string | null; recommended_tone: string | null }>(
    (insights || []).map((row: { client_id: string; lead_read: string | null; recommended_tone: string | null }) => [
      row.client_id,
      row,
    ]),
  );

  for (const enrollment of enrollments || []) {
    const rawSteps = enrollment.lead_sequence_step_instances;
    const steps = (Array.isArray(rawSteps) ? rawSteps : []).sort(
      (a: { step_index: number }, b: { step_index: number }) => a.step_index - b.step_index,
    );
    const activeStep =
      steps.find((s: { status: string }) =>
        ['awaiting_approval', 'pending'].includes(s.status),
      ) || null;

    const insight = insightByClient.get(enrollment.client_id);
    const awaitingApproval = activeStep?.status === 'awaiting_approval';

    map.set(enrollment.client_id, {
      enrollment_id: enrollment.id,
      status: enrollment.status,
      temperature_at_enroll: enrollment.temperature_at_enroll,
      followup_active: enrollment.status === 'active',
      awaiting_approval: awaitingApproval,
      lead_read: insight?.lead_read ?? null,
      recommended_tone: insight?.recommended_tone ?? null,
      next_step: activeStep
        ? {
            id: activeStep.id,
            step_index: activeStep.step_index,
            step_type: activeStep.step_type,
            status: activeStep.status,
            due_at: activeStep.due_at,
            subject: activeStep.subject,
            body: activeStep.body,
          }
        : null,
    });
  }

  return map;
}

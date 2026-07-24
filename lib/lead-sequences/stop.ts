type SupabaseLike = { from: (table: string) => any };

/** Cancel active enrollment, pending steps, and legacy email_sequences rows. */
export async function stopLeadSequence(
  supabase: SupabaseLike,
  clientId: string,
  agentId: string,
): Promise<void> {
  const now = new Date().toISOString();

  const { data: enrollments } = await supabase
    .from('lead_sequence_enrollments')
    .select('id')
    .eq('client_id', clientId)
    .eq('agent_user_id', agentId)
    .in('status', ['active', 'paused']);

  const enrollmentIds = (enrollments || []).map((e: { id: string }) => e.id);

  if (enrollmentIds.length > 0) {
    await supabase
      .from('lead_sequence_step_instances')
      .update({ status: 'cancelled', updated_at: now })
      .in('enrollment_id', enrollmentIds)
      .in('status', ['awaiting_approval', 'pending']);

    await supabase
      .from('lead_sequence_enrollments')
      .update({ status: 'cancelled', updated_at: now, completed_at: now })
      .in('id', enrollmentIds);
  }

  await supabase
    .from('email_sequences')
    .update({ status: 'cancelled' })
    .eq('client_id', clientId)
    .eq('agent_user_id', agentId)
    .eq('status', 'pending');
}

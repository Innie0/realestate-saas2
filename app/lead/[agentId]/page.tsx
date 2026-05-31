// Public lead capture page.
//
// Reachable at /lead/<agentId>. No authentication required — this is the link
// an agent shares publicly (Instagram bio, email signature, business cards).
// A prospect fills out the form and the submission lands in the agent's CRM.

import { createAdminClient } from '@/lib/supabase-admin';
import LeadCaptureForm from '@/components/LeadCaptureForm';

interface LeadPageProps {
  params: { agentId: string };
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Look up the agent's display name. Returns null if the link is invalid.
 */
async function getAgent(agentId: string) {
  if (!UUID_REGEX.test(agentId)) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email')
    .eq('id', agentId)
    .single();

  if (error || !data) return null;
  return data as { id: string; full_name: string | null; email: string };
}

export default async function LeadCapturePage({ params }: LeadPageProps) {
  const agent = await getAgent(params.agentId);

  // Invalid or unknown link
  if (!agent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Form not available
          </h1>
          <p className="text-gray-600">
            This contact link is invalid or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const agentName = agent.full_name?.trim() || 'your agent';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-10 px-4 flex items-center justify-center">
      <div className="w-full max-w-lg">
        {/* Heading */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white">
            Get in touch with {agentName}
          </h1>
          <p className="text-slate-300 mt-2">
            Share a few details and {agentName} will reach out to help with your
            real estate needs.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <LeadCaptureForm agentId={agent.id} agentName={agentName} />
        </div>
      </div>
    </div>
  );
}

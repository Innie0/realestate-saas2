import { test, expect } from './fixtures';
import { gotoDashboard } from './fixtures';
import { E2E_PREFIX, apiJson, readCredentials } from './helpers';

test.describe('Leads Inbox', () => {
  test('submits a lead, appears in inbox with scoring and follow-up', async ({ page, request }) => {
    const creds = readCredentials();
    expect(creds.userId).toBeTruthy();

    await apiJson(request, 'PUT', '/api/agent-settings', { auto_followup_enabled: true });

    const leadName = `${E2E_PREFIX} Lead`;
    const leadEmail = `${E2E_PREFIX.toLowerCase()}-lead@e2e.test`;

    const leadRes = await request.post('/api/leads', {
      data: {
        agentId: creds.userId,
        name: leadName,
        email: leadEmail,
        phone: '5125550199',
        leadType: 'buyer',
        timeline: 'asap',
        area: 'East Austin',
        message: 'Timeline: ASAP\nArea: East Austin',
        source: 'lead_form',
      },
    });
    const leadJson = await leadRes.json();

    expect(
      leadJson.success,
      leadJson.error ||
        'Lead capture failed — check SUPABASE_SERVICE_ROLE_KEY and public.users row for the E2E agent',
    ).toBe(true);

    await gotoDashboard(page, '/dashboard/leads');
    await expect(page.getByRole('heading', { name: leadName })).toBeVisible({ timeout: 30_000 });

    const inboxRes = await apiJson(request, 'GET', '/api/clients?status=all&view=inbox');
    const lead = (inboxRes.json.data as { email?: string; followup_active?: boolean }[]).find(
      (l) => l.email === leadEmail,
    );
    expect(lead).toBeTruthy();
    expect(lead!.followup_active).toBeTruthy();
  });
});

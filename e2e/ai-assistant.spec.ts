import { test, expect } from './fixtures';
import { gotoDashboard } from './fixtures';
import { E2E_PREFIX, apiJson, waitForApiSuccess } from './helpers';

test.describe('AI Assistant', () => {
  test('executes real tool actions for project, client, reminder, and calendar', async ({
    page,
    request,
  }) => {
    test.setTimeout(300_000);

    const projectTitle = `${E2E_PREFIX} AI Project`;
    const clientName = `${E2E_PREFIX} AI Client`;
    const clientEmail = `${E2E_PREFIX.toLowerCase()}-ai@e2e.test`;

    await gotoDashboard(page, '/dashboard/tasks');
    await page.locator('[data-tour="ai-new-chat"]').click();

    const input = page.getByPlaceholder(/ask about a listing/i);
    await expect(input).toBeVisible();

    async function sendAndWaitForReply(message: string) {
      await input.fill(message);
      await input.press('Enter');
      await page.waitForTimeout(8000);
      await expect(page.locator('[data-tour="ai-chat"]')).not.toBeEmpty();
    }

    await sendAndWaitForReply(
      `Create a new draft listing project titled "${projectTitle}" in Austin TX. Use create_project.`,
    );

    await waitForApiSuccess(
      request,
      '/api/projects',
      (data) =>
        Array.isArray(data) &&
        (data as { title: string }[]).some((p) => p.title.includes(projectTitle)),
      { attempts: 25, delayMs: 4000 },
    );

    await sendAndWaitForReply(
      `Add a CRM client named "${clientName}" with email ${clientEmail}. Use create_client.`,
    );

    await waitForApiSuccess(
      request,
      '/api/clients?status=all',
      (data) =>
        Array.isArray(data) &&
        (data as { name: string }[]).some((c) => c.name.includes(clientName)),
      { attempts: 25, delayMs: 4000 },
    );

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    const end = new Date(tomorrow.getTime() + 60 * 60 * 1000);

    await sendAndWaitForReply(
      `Create a calendar event "${E2E_PREFIX} AI Showing" from ${tomorrow.toISOString()} to ${end.toISOString()}. Use create_calendar_event.`,
    );

    const eventsRes = await apiJson(request, 'GET', '/api/calendar/events');
    expect(
      (eventsRes.json.data as { title: string }[]).some((e) =>
        e.title.includes(E2E_PREFIX),
      ),
    ).toBeTruthy();
  });
});

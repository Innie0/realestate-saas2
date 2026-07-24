import { test, expect } from './fixtures';
import { gotoDashboard } from './fixtures';
import { E2E_PREFIX, apiJson } from './helpers';

test.describe('Calendar', () => {
  test('creates a local event and exercises sync API', async ({ page, request }) => {
    const connectionsRes = await apiJson(request, 'GET', '/api/calendar/connections');
    expect(connectionsRes.json.success).toBe(true);

    await gotoDashboard(page, '/dashboard/calendar');
    await page.getByRole('button', { name: /new event/i }).click();

    const title = `${E2E_PREFIX} Showing`;
    await page.getByLabel('Event Title *').fill(title);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const end = new Date(tomorrow.getTime() + 60 * 60 * 1000);
    const fmt = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    await page.locator('#start_time').fill(fmt(tomorrow));
    await page.locator('#end_time').fill(fmt(end));

    const createPromise = page.waitForResponse(
      (r) => r.url().includes('/api/calendar/events') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Create Event' }).click();
    const createRes = await createPromise;
    expect(createRes.ok()).toBeTruthy();
    const created = await createRes.json();
    expect(created.success).toBe(true);
    expect((created.data as { title: string }).title).toBe(title);

    const listRes = await apiJson(request, 'GET', '/api/calendar/events');
    const found = (listRes.json.data as { title: string }[]).some((e) => e.title === title);
    expect(found).toBe(true);

    const syncRes = await apiJson(request, 'POST', '/api/calendar/sync');
    expect(syncRes.json.success).toBe(true);
  });
});

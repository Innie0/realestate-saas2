import { test, expect } from './fixtures';
import { gotoDashboard } from './fixtures';
import { E2E_PREFIX, apiJson } from './helpers';

test.describe('Clients', () => {
  test('adds a client, edits them, and persists changes via API', async ({ page, request }) => {
    const originalName = `${E2E_PREFIX} Client Original`;
    const updatedName = `${E2E_PREFIX} Client Updated`;
    const email = `${E2E_PREFIX.toLowerCase()}@e2e.test`;

    await gotoDashboard(page, '/dashboard/clients');
    await page.locator('[data-tour="clients-add"]').click();
    await page.getByLabel('Name *').fill(originalName);
    await page.getByLabel('Email').fill(email);
    await page.getByRole('button', { name: /create client/i }).click();

    await expect(page.getByText(originalName)).toBeVisible({ timeout: 20_000 });

    const listRes = await apiJson(request, 'GET', '/api/clients?status=all');
    const created = (listRes.json.data as { id: string; name: string }[]).find(
      (c) => c.name === originalName,
    );
    expect(created).toBeTruthy();

    await page.goto(`/dashboard/clients/${created!.id}`);
    await page.getByRole('button', { name: 'Edit' }).click();
    await page.getByLabel('Name *').fill(updatedName);

    const updatePromise = page.waitForResponse(
      (r) => r.url().includes(`/api/clients/${created!.id}`) && r.request().method() === 'PUT',
    );
    await page.getByRole('button', { name: /update client/i }).click();
    await updatePromise;

    const getRes = await apiJson(request, 'GET', `/api/clients/${created!.id}`);
    expect((getRes.json.data as { name: string }).name).toBe(updatedName);
  });
});

import { test, expect } from './fixtures';
import { gotoDashboard } from './fixtures';
import { E2E_PREFIX, apiJson } from './helpers';

test.describe('Transactions', () => {
  test('creates a transaction, links buyer/seller clients, updates a date', async ({ page, request }) => {
    const buyerName = `${E2E_PREFIX} Buyer`;
    const sellerName = `${E2E_PREFIX} Seller`;
    const address = `${E2E_PREFIX} 789 Pine Rd`;

    const buyerRes = await apiJson(request, 'POST', '/api/clients', {
      name: buyerName,
      email: `${E2E_PREFIX}-buyer@e2e.test`,
    });
    const sellerRes = await apiJson(request, 'POST', '/api/clients', {
      name: sellerName,
      email: `${E2E_PREFIX}-seller@e2e.test`,
    });
    expect(buyerRes.json.success && sellerRes.json.success).toBe(true);

    await gotoDashboard(page, '/dashboard/transactions/new');
    await page.getByLabel('Property Address *').fill(address);
    await page.getByLabel('City').fill('Austin');
    await page.getByLabel('State').fill('TX');

    await page.getByRole('button', { name: 'Buyer & Seller' }).click();
    await page.getByLabel('Buyer Name *').fill(buyerName);
    await page.getByRole('option', { name: new RegExp(buyerName, 'i') }).click({ timeout: 15_000 });
    await page.getByLabel('Seller Name *').fill(sellerName);
    await page.getByRole('option', { name: new RegExp(sellerName, 'i') }).click({ timeout: 15_000 });

    await page.getByRole('button', { name: 'Financial' }).click();
    await page.getByLabel('Offer Price *').fill('500000');
    await page.getByRole('button', { name: 'Important Dates' }).click();
    await page.getByLabel('Closing Date').fill('2026-08-15');
    await page.getByRole('button', { name: /create transaction/i }).click();
    await page.waitForURL(/\/dashboard\/transactions\/[0-9a-f-]+/, { timeout: 30_000 });
    const txId = page.url().split('/').pop()!;

    await page.getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByRole('heading', { name: 'Edit Transaction' })).toBeVisible();
    await page.getByRole('button', { name: 'Important Dates' }).click();
    const closingInput = page.getByLabel('Closing Date');
    await closingInput.waitFor({ state: 'visible' });
    await closingInput.fill('2026-09-01');

    const updatePromise = page.waitForResponse(
      (r) => r.url().includes(`/api/transactions/${txId}`) && r.request().method() === 'PUT',
    );
    await page.getByRole('button', { name: /update transaction/i }).click();
    const updateRes = await updatePromise;
    expect(updateRes.ok()).toBeTruthy();

    const txRes = await apiJson(request, 'GET', `/api/transactions/${txId}`);
    expect((txRes.json.data as { closing_date?: string }).closing_date).toMatch(/2026-09-01/);
  });
});

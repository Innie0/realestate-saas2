import { test, expect } from './fixtures';
import { gotoDashboard } from './fixtures';
import { E2E_PREFIX, apiJson } from './helpers';

test.describe('Projects', () => {
  test('creates a project, generates AI description and social caption', async ({ page, request }) => {
    const title = `${E2E_PREFIX} Listing`;

    await gotoDashboard(page, '/dashboard/projects/new');
    await page.getByLabel('Project Title').fill(title);
    await page.getByLabel('Street Address').fill('456 Oak Avenue');
    await page.getByLabel('City').fill('Austin');
    await page.getByLabel('State').fill('TX');
    await page.getByLabel('ZIP Code').fill('78701');
    await page.getByLabel('Bedrooms').fill('3');
    await page.getByLabel('Bathrooms').fill('2');
    await page.getByLabel('Square Feet').fill('1800');
    await page.getByLabel('Price ($)').fill('425000');
    await page.getByRole('button', { name: /create project/i }).click();

    await page.waitForURL(/\/dashboard\/projects\/[0-9a-f-]+/, { timeout: 30_000 });
    const projectId = page.url().split('/').pop()!;

    await page.getByRole('button', { name: 'AI Content' }).click();
    await page.getByRole('button', { name: /generate content/i }).click();
    await expect(page.getByRole('heading', { name: 'Choose Your Description Style' })).toBeVisible({
      timeout: 120_000,
    });

    const instagramPreview = page.getByRole('dialog').locator('textarea').first();
    await expect(instagramPreview).not.toHaveValue('', { timeout: 30_000 });

    await page.getByRole('button', { name: 'Use This Style' }).click();

    const savePromise = page.waitForResponse(
      (r) => r.url().includes(`/api/projects/${projectId}`) && r.request().method() === 'PUT',
    );
    await page.getByRole('button', { name: 'Save' }).click();
    const saveRes = await savePromise;
    expect(saveRes.ok()).toBeTruthy();

    const afterSave = await apiJson(request, 'GET', `/api/projects/${projectId}`);
    const ai = (afterSave.json.data as { ai_content?: { instagram?: string; description?: string } })
      .ai_content;
    expect(ai).toBeTruthy();
    expect(
      (ai?.instagram?.length || 0) > 10 || (ai?.description?.length || 0) > 20,
    ).toBeTruthy();
  });
});

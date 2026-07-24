import { test, expect } from './fixtures';
import { gotoDashboard } from './fixtures';
import { apiJson } from './helpers';

test.describe('Ads', () => {
  test('connection APIs respond and campaigns endpoint works', async ({ page, request }) => {
    const connectionsRes = await apiJson(request, 'GET', '/api/ads/connections');
    expect(connectionsRes.json.success).toBe(true);

    const campaignsRes = await apiJson(request, 'GET', '/api/ads/campaigns');
    expect(campaignsRes.json.success).toBe(true);

    await gotoDashboard(page, '/dashboard/ads');
    await page.getByRole('button', { name: /ad accounts/i }).click();
    await expect(page.getByRole('heading', { name: 'Google Ads' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Meta Ads' })).toBeVisible();

    const connectRes = await apiJson(request, 'POST', '/api/ads/google/connect');
    if (connectRes.status === 503) {
      expect(connectRes.json.error).toMatch(/not configured/i);
    } else {
      expect(connectRes.json.success).toBe(true);
    }
  });
});

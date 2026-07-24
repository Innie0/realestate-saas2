import { test, expect } from './fixtures';
import { apiJson } from './helpers';

test.describe('Property Lookup + CMA', () => {
  test('runs demo lookup and CMA and returns valuation data', async ({ request }) => {
    const payload = {
      street: '123 W Main Street',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
    };

    const lookupRes = await apiJson(request, 'POST', '/api/property-lookup', payload);
    expect(lookupRes.json.success).toBe(true);
    expect((lookupRes.json.data as { found?: boolean }).found).toBe(true);

    const cmaRes = await apiJson(request, 'POST', '/api/market-analysis', payload);
    expect(cmaRes.json.success).toBe(true);
    const valuation = (cmaRes.json.data as { valuation?: { suggestedPrice?: number | null } }).valuation;
    expect(valuation?.suggestedPrice).toBeGreaterThan(0);
  });
});

import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export const TOUR_KEYS = [
  'tour_dashboard',
  'tour_projects',
  'tour_clients',
  'tour_leads',
  'tour_property_research',
  'tour_ai_assistant',
];

export async function armTourDismiss(page: Page) {
  await page.addInitScript((keys: string[]) => {
    keys.forEach((k) => localStorage.setItem(k, '1'));
  }, TOUR_KEYS);
}

export async function dismissDriverPopover(page: Page) {
  for (let i = 0; i < 5; i++) {
    const popover = page.locator('#driver-popover-content');
    if (!(await popover.isVisible().catch(() => false))) return;
    await page
      .locator('.driver-popover-close-btn, button.driver-popover-next-btn')
      .last()
      .click()
      .catch(() => page.keyboard.press('Escape'));
    await page.waitForTimeout(400);
  }
}

export async function gotoDashboard(page: Page, path: string) {
  await armTourDismiss(page);
  await page.goto(path);
  await dismissDriverPopover(page);
}

export const test = base.extend({
  page: async ({ page }, use) => {
    await armTourDismiss(page);
    await use(page);
  },
});

export { expect };

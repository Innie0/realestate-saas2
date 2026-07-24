import type { APIRequestContext, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export const RUN_ID = `${Date.now()}`;
export const E2E_PREFIX = `E2E-${RUN_ID}`;

export function credentialsPath() {
  return path.join(__dirname, '.auth/credentials.json');
}

export function readCredentials(): { email: string; password: string; userId: string | null } {
  return JSON.parse(fs.readFileSync(credentialsPath(), 'utf-8'));
}

export async function apiJson<T = unknown>(
  request: APIRequestContext,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  body?: unknown,
): Promise<{ ok: boolean; status: number; json: T & { success?: boolean; error?: string; data?: unknown } }> {
  const response = await request.fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    data: body ? JSON.stringify(body) : undefined,
  });
  const json = (await response.json().catch(() => ({}))) as T & {
    success?: boolean;
    error?: string;
    data?: unknown;
  };
  return { ok: response.ok(), status: response.status(), json };
}

export async function waitForApiSuccess(
  request: APIRequestContext,
  url: string,
  predicate: (data: unknown) => boolean,
  { attempts = 15, delayMs = 2000 } = {},
) {
  for (let i = 0; i < attempts; i++) {
    const { json } = await apiJson(request, 'GET', url);
    if (json.success && predicate(json.data)) return json.data;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

export async function selectState(page: Page, stateCode: string) {
  const stateField = page.getByText('State *').locator('..').getByRole('button').first();
  if (await stateField.isVisible().catch(() => false)) {
    await stateField.click();
    await page.getByRole('option', { name: new RegExp(stateCode, 'i') }).first().click();
  }
}

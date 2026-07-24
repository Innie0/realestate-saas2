import { test as setup, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const AUTH_FILE = path.join(__dirname, '.auth/user.json');
const CREDENTIALS_FILE = path.join(__dirname, '.auth/credentials.json');

setup('authenticate', async ({ page }) => {
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    throw new Error('Missing e2e/.auth/credentials.json — run global-setup first');
  }

  const { email, password } = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8')) as {
    email: string;
    password: string;
  };

  await page.goto('/auth/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await page.waitForURL(/\/dashboard/, { timeout: 60_000 });
  await expect(page).toHaveURL(/\/dashboard/);

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  await page.context().storageState({ path: AUTH_FILE });
});

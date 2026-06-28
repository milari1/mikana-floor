import { expect, test, type Page } from '@playwright/test';

/**
 * Three-tap stop flow. Requires a seeded database (Catering site, Casey crew,
 * PIN 1234, plus a MOD at the site).
 */
async function signInAsCrew(page: Page) {
  await page.goto('/crew/shift-on');
  await page.getByLabel('Site').selectOption({ index: 0 });
  for (const digit of '1234') {
    await page.getByRole('button', { name: `Digit ${digit}` }).click();
  }
  await page.waitForURL('**/crew');
}

test('three-tap stop completes online in under 8s', async ({ page }) => {
  await signInAsCrew(page);

  const start = Date.now();
  await page.getByRole('link', { name: 'STOP' }).click(); // tap 1
  await page.getByRole('link', { name: 'Equipment' }).click(); // tap 2
  await page.getByRole('button', { name: 'Not working' }).click(); // tap 3

  await expect(page.getByRole('heading', { name: 'Stop logged' })).toBeVisible();
  expect(Date.now() - start).toBeLessThan(8000);
});

test('stop is queued when the connection drops mid-flow', async ({
  page,
  context,
}) => {
  await signInAsCrew(page);

  await page.getByRole('link', { name: 'STOP' }).click();
  await page.getByRole('link', { name: 'Equipment' }).click();

  // Lose connectivity before the final tap.
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Not working' }).click();

  await expect(page.getByRole('heading', { name: 'Stop logged' })).toBeVisible();
  await expect(page.getByText(/Saved on this device/)).toBeVisible();

  await context.setOffline(false);
});

import { expect, test, type Page } from '@playwright/test';

/**
 * Kaizen capture. Voice input can't be driven in headless Playwright, so this
 * exercises the text path (the editable transcript) which shares the same
 * submit. Requires a seeded database (Catering site, Casey crew, PIN 1234).
 */
async function signInAsCrew(page: Page) {
  await page.goto('/crew/shift-on');
  await page.getByLabel('Site').selectOption({ index: 0 });
  for (const digit of '1234') {
    await page.getByRole('button', { name: `Digit ${digit}` }).click();
  }
  await page.waitForURL('**/crew');
}

test('kaizen text submit logs an item', async ({ page }) => {
  await signInAsCrew(page);

  await page.getByRole('link', { name: 'KAIZEN' }).click();
  await page
    .getByLabel('Kaizen idea')
    .fill('Move the labeler next to the scale to save steps.');
  await page.getByRole('button', { name: 'Log idea' }).click();

  await expect(page.getByRole('heading', { name: 'Logged' })).toBeVisible();
  await expect(page.getByText('Will surface in the next huddle.')).toBeVisible();
});

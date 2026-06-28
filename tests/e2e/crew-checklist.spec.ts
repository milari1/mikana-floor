import { expect, test, type Page } from '@playwright/test';

/**
 * Checklist completion, offline then reconnect.
 * Requires a seeded database (Catering site, Casey crew, PIN 1234, standards).
 * Full cold-offline navigation depends on the PWA precache added in Prompt 8;
 * here we open the checklist online, then drop the connection before completing.
 */
async function signInAsCrew(page: Page) {
  await page.goto('/crew/shift-on');
  await page.getByLabel('Site').selectOption({ index: 0 });
  for (const digit of '1234') {
    await page.getByRole('button', { name: `Digit ${digit}` }).click();
  }
  await page.waitForURL('**/crew');
}

test('checklist completes offline and syncs on reconnect', async ({
  page,
  context,
}) => {
  await signInAsCrew(page);

  const res = await page.request.get('/api/standards');
  const standards = (await res.json()) as { id: string; steps: unknown[] }[];
  expect(standards.length).toBeGreaterThan(0);
  const standard = standards[0];
  const stepCount = standard.steps.length;

  await page.goto(`/crew/checklist/${standard.id}`);
  await expect(page.getByText(`0/${stepCount}`)).toBeVisible();

  // Lose connectivity, then complete every step (each queues offline).
  await context.setOffline(true);
  for (let i = 0; i < stepCount; i++) {
    await page.getByRole('button', { name: 'Done' }).first().click();
  }
  await expect(page.getByText(`${stepCount}/${stepCount}`)).toBeVisible();

  // Reconnect: CrewOfflineSync drains the queue to /api/sync.
  await context.setOffline(false);
  await page.waitForTimeout(1500);
});

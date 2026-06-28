import { expect, test } from '@playwright/test';

/**
 * Crew shift-on (PIN) flow.
 *
 * Requires a seeded database: the default site (alphabetically "Mikana
 * Catering — Central Kitchen") has crew user "Casey Crew" with PIN 1234.
 *
 * Viewport is iPhone 14 (390x844) via playwright.config.ts.
 */
const VIEWPORT_HEIGHT = 844;
const CREW_PIN = '1234';

test('PIN sign-in redirects to Today with STOP reachable without scrolling', async ({
  page,
}) => {
  await page.goto('/crew/shift-on');

  // Catering is the default (first, alphabetical) site — Casey's site.
  await page.getByLabel('Site').selectOption({ index: 0 });

  // Enter the 4-digit PIN on the keypad; the form auto-submits on the 4th digit.
  for (const digit of CREW_PIN) {
    await page.getByRole('button', { name: `Digit ${digit}` }).click();
  }

  // Lands on the Today screen.
  await page.waitForURL('**/crew');
  await expect(page.getByRole('heading', { name: 'Casey' })).toBeVisible();

  // Action bar is present.
  const actionBar = page.getByRole('navigation', { name: 'Crew quick actions' });
  await expect(actionBar).toBeVisible();

  // STOP is visible and fully within the viewport (no scrolling needed).
  const stop = page.getByRole('link', { name: 'STOP' });
  await expect(stop).toBeVisible();
  const box = await stop.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y + box!.height).toBeLessThanOrEqual(VIEWPORT_HEIGHT);
});

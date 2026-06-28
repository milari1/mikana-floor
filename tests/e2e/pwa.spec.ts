import { expect, test } from '@playwright/test';

/**
 * PWA installability checks. The Service Worker is only emitted in production
 * builds (disabled in dev), so run these against `npm run build && npm start`.
 * Lighthouse PWA > 90 is a manual/CI target, not asserted here.
 */
test('manifest is served and well-formed', async ({ page }) => {
  const res = await page.request.get('/manifest.json');
  expect(res.ok()).toBeTruthy();
  const manifest = await res.json();
  expect(manifest.name).toBe('Mikana Floor');
  expect(manifest.short_name).toBe('Floor');
  expect(manifest.start_url).toBe('/crew');
  expect(manifest.display).toBe('standalone');
  expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
});

test('document links the manifest', async ({ page }) => {
  await page.goto('/crew/shift-on');
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    'href',
    /manifest/,
  );
});

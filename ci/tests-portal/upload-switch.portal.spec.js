// Portal smoke — CSV/Excel upload happy-path + winery switcher.
// Demo mode (config intercepted): no login, no live writes.
const { test, expect, assertClean, boot } = require('./_fixtures');

test('CSV upload → preview → confirm & publish (demo)', async ({ page }) => {
  await boot(page);
  await page.locator('.nav-link[data-go="upload"]').click();
  await expect(page.locator('#pick')).toBeVisible();

  // agree to T&C gate if present (upload is gated until accepted)
  const agree = page.locator('#terms-agree');
  if (await agree.count()) { await agree.check(); }

  // feed a CSV straight to the hidden file input (drag-drop equivalent)
  const csv = [
    'name,variety,vintage,price,stock,region,tasting notes',
    'Crimson Pinot Noir,Pinot Noir,2023,32,60,Martinborough,"Cherry, plum and soft spice"',
    'Coastal Sauvignon Blanc,Sauvignon Blanc,2024,24,120,Marlborough,Bright and zesty',
  ].join('\n');
  await page.locator('#file').setInputFiles({ name: 'range.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });

  // preview renders with a confirm button naming the row count
  const confirm = page.locator('#preview #confirm');
  await expect(confirm).toBeVisible({ timeout: 8000 });
  await expect(confirm).toContainText(/publish\s+2\s+wines/i);
  await expect(confirm).toBeEnabled();          // both rows have a region → not blocked

  // quote-aware parse: the comma inside "Cherry, plum and soft spice" must NOT
  // have split into an extra column (would have shifted region/price)
  await expect(page.locator('#preview')).toContainText('Crimson Pinot Noir');
  await expect(page.locator('#preview')).toContainText('Martinborough');

  await confirm.click();
  await expect(page.locator('#preview')).toContainText(/Demo|synced|published/i);
  assertClean(page);
});

test('CSV missing region blocks publish', async ({ page }) => {
  await boot(page);
  await page.locator('.nav-link[data-go="upload"]').click();
  const agree = page.locator('#terms-agree'); if (await agree.count()) await agree.check();
  const csv = 'name,variety,vintage,price,stock\nOrphan Red,Merlot,2022,20,10';
  await page.locator('#file').setInputFiles({ name: 'noregion.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  const confirm = page.locator('#preview #confirm');
  await expect(confirm).toBeVisible({ timeout: 8000 });
  await expect(confirm).toBeDisabled();         // no region → publish blocked
  assertClean(page);
});

test('winery switcher: single-winery demo shows no switch menu', async ({ page }) => {
  await boot(page);
  // The switcher (#winery-menu) only appears for a multi-winery LIVE login.
  // In single-winery demo the badge shows the winery name and is not switchable.
  const badge = page.locator('#wb');
  await expect(badge).toBeVisible();
  expect(await page.locator('#winery-menu').count()).toBe(0);
  expect(await badge.evaluate(el => el.classList.contains('switchable'))).toBeFalsy();
  assertClean(page);
});

test('winery switcher: menu toggles when present (guarded)', async ({ page }) => {
  await boot(page);
  const menu = page.locator('#winery-menu');
  if (!(await menu.count())) { test.skip(true, 'single-winery demo — no switcher to exercise'); return; }
  await page.locator('#wb').click();
  await expect(menu).toHaveClass(/open/);
  const items = menu.locator('.wm-item');
  expect(await items.count()).toBeGreaterThan(1);
  await page.locator('#wb').click();
  await expect(menu).not.toHaveClass(/open/);
  assertClean(page);
});

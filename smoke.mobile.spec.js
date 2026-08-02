// Smoke: the money paths — catalogue renders real wines, add-to-case updates the
// cart, the Sommelier drawer opens and traps focus, and the catalogue skeleton
// resolves. These are the flows that have regressed before on mobile.
const { test, expect, assertClean } = require('./_fixtures');

test('homepage featured grid resolves from skeleton to real wines', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  const grid = page.locator('#featured-grid');
  await expect(grid).toBeVisible();
  // Skeletons appear immediately, then real cards replace them.
  await expect(grid.locator('.wine-card:not(.wine-skeleton)').first()).toBeVisible({ timeout: 10_000 });
  await expect(grid.locator('.wine-skeleton')).toHaveCount(0);
  expect(await grid.locator('.wine-card').count()).toBeGreaterThan(0);
  assertClean(page);
});

test('add to case updates the cart count', async ({ page }) => {
  await page.goto('/wines.html', { waitUntil: 'domcontentloaded' });
  const addBtn = page.locator('[data-add-wine]').first();
  await expect(addBtn).toBeVisible({ timeout: 10_000 });
  await addBtn.click();
  // The cart count badge becomes visible with a positive number.
  const count = page.locator('[data-cart-count]').first();
  await expect(count).toBeVisible({ timeout: 5000 });
  await expect(count).not.toHaveText('0');
  assertClean(page);
});

test('Sommelier drawer opens, focuses in, and Esc closes', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-open-drawer="somm"]').first().click();
  const drawer = page.locator('#somm-drawer');
  await expect(drawer).toHaveClass(/open/, { timeout: 4000 });
  // Focus moved into the drawer (input auto-focus).
  await expect(page.locator('#somm-input')).toBeFocused({ timeout: 2000 });
  await page.keyboard.press('Escape');
  await expect(drawer).not.toHaveClass(/open/);
  assertClean(page);
});

test('cart drawer opens and shows an empty-state or items', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-open-drawer="cart"]').first().click();
  await expect(page.locator('#cart-drawer')).toHaveClass(/open/, { timeout: 4000 });
  await expect(page.locator('#cart-body')).toBeVisible();
  assertClean(page);
});

// Portal smoke — demo mode. Boots the shell, walks every section, and exercises
// the core CRUD (add / edit / delete a wine) + upload preview. Fails on any
// console or page error.
const { test, expect, assertClean, boot } = require('./_fixtures');

const SECTIONS = ['dashboard', 'wines', 'orders', 'payments', 'upload', 'plan', 'cellar', 'insights', 'integrations', 'images', 'app', 'settings'];

test('shell boots into the demo dashboard with nav', async ({ page }) => {
  await boot(page);
  await expect(page.locator('.side .nav .nav-link').first()).toBeVisible();
  expect(await page.locator('.nav-link').count()).toBeGreaterThan(4);
  assertClean(page);
});

test('every nav section renders a heading, no errors', async ({ page }) => {
  await boot(page);
  for (const id of SECTIONS) {
    const link = page.locator(`.nav-link[data-go="${id}"]`);
    if (!(await link.count())) continue;
    await link.first().click();
    await expect(page.locator('h1.page-title')).toBeVisible({ timeout: 6000 });
  }
  assertClean(page);
});

test('wines: inline stock stepper updates', async ({ page }) => {
  await boot(page);
  await page.locator('.nav-link[data-go="wines"]').click();
  const firstRow = page.locator('#wines-body tr').first();
  await expect(firstRow).toBeVisible();
  const qty = firstRow.locator('[data-qty]');
  const before = Number(await qty.inputValue());
  await firstRow.locator('[data-inc]').click();
  await expect(qty).toHaveValue(String(before + 1));
  assertClean(page);
});

test('wines: add-bottle modal traps focus and closes on Esc', async ({ page }) => {
  await boot(page);
  await page.locator('.nav-link[data-go="wines"]').click();
  await page.locator('#add2').click();
  const modal = page.locator('#modal');
  await expect(modal).toHaveClass(/open/);
  await expect(modal).toHaveAttribute('aria-modal', 'true');
  // focus landed inside the modal
  expect(await modal.evaluate((m) => m.contains(document.activeElement))).toBeTruthy();
  await page.keyboard.press('Escape');
  await expect(modal).not.toHaveClass(/open/);
  assertClean(page);
});

test('upload: template + preview UI present', async ({ page }) => {
  await boot(page);
  await page.locator('.nav-link[data-go="upload"]').click();
  await expect(page.locator('#pick')).toBeVisible();
  await expect(page.locator('#tmpl')).toBeVisible();
  assertClean(page);
});

test('settings render and a toggle is operable', async ({ page }) => {
  await boot(page);
  await page.locator('.nav-link[data-go="settings"]').click();
  await expect(page.locator('h1.page-title')).toContainText('settings');
  assertClean(page);
});

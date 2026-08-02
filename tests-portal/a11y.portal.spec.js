// Portal accessibility smoke — locks in the 2 Aug a11y pass so it can't regress.
const { test, expect, assertClean, boot } = require('./_fixtures');

test('focus is visible, skip link + landmark present', async ({ page }) => {
  await boot(page);
  // a :focus-visible rule exists in the stylesheet
  const hasFocusVisible = await page.evaluate(() =>
    [...document.styleSheets].some((s) => { try { return [...s.cssRules].some((r) => /focus-visible/.test(r.selectorText || '')); } catch (e) { return false; } })
  );
  expect(hasFocusVisible).toBeTruthy();
  await expect(page.locator('a.skip-link')).toHaveCount(1);
  await expect(page.locator('#main[role="main"]')).toHaveCount(1);
  assertClean(page);
});

test('icon-only controls are labelled', async ({ page }) => {
  await boot(page);
  await expect(page.locator('#menu')).toHaveAttribute('aria-label', /.+/);
  await page.locator('.nav-link[data-go="wines"]').click();
  await expect(page.locator('#wines-body tr').first().locator('[data-del]')).toHaveAttribute('aria-label', /Remove/);
});

test('data-table headers carry scope', async ({ page }) => {
  await boot(page);
  await page.locator('.nav-link[data-go="wines"]').click();
  const headers = page.locator('table.tbl thead th');
  const withText = await headers.evaluateAll((ths) => ths.filter((t) => t.textContent.trim()).length);
  const scoped = await headers.evaluateAll((ths) => ths.filter((t) => t.getAttribute('scope') === 'col').length);
  expect(scoped).toBe(withText);
});

test('micro-text token meets a darker contrast floor', async ({ page }) => {
  await boot(page);
  const muted = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--muted').trim());
  // #6E6153 is the AA-corrected value; assert it's no lighter than the old #8B7E6E
  expect(muted.toLowerCase()).toBe('#6e6153');
});

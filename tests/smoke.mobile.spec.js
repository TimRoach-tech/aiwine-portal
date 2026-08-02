// Smoke: mobile reflow — at a 320px viewport no key page scrolls horizontally
// (WCAG 1.4.10 backstop) and the bottom tab bar is present with the right tabs.
const { test, expect } = require('./_fixtures');

const NARROW = { width: 320, height: 720 };
const PAGES = ['/index.html', '/wines.html', '/gift-cards.html', '/regions.html'];

test.use({ viewport: NARROW });

for (const path of PAGES) {
  test(`no horizontal scroll at 320px: ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400); // let layout settle
    const overflow = await page.evaluate(() => {
      const el = document.scrollingElement || document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow, `${path} overflows horizontally by ${overflow}px`).toBeLessThanOrEqual(1);
  });
}

test('mobile bottom-nav shows Home + Wines (not Regions)', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  const tabs = page.locator('.btabs .bt-lb');
  await expect(tabs.first()).toBeVisible({ timeout: 6000 });
  const labels = await tabs.allTextContents();
  expect(labels).toContain('Home');
  expect(labels).toContain('Wines');
  expect(labels).not.toContain('Regions');
});

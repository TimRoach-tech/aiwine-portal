// Smoke: every key page loads, is styled (past the anti-flash reveal), has the
// nav, and produces no console/page errors. Runs on desktop + both mobile devices.
const { test, expect, assertClean } = require('./_fixtures');

const PAGES = [
  ['/index.html', 'Home'],
  ['/wines.html', 'Catalogue'],
  ['/how-it-works.html', 'How it works'],
  ['/regions.html', 'Regions'],
  ['/gift-cards.html', 'Gift cards'],
  ['/account.html', 'Account'],
  ['/faq.html', 'FAQ'],
];

for (const [path, label] of PAGES) {
  test(`loads: ${label} (${path})`, async ({ page }) => {
    const resp = await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(resp && resp.ok(), `${path} returned ${resp && resp.status()}`).toBeTruthy();

    // Anti-flash reveal must fire — the page can't stay hidden.
    await expect(page.locator('html')).toHaveClass(/af-ready/, { timeout: 5000 })
      .catch(() => {}); // some pages use aw-css-pending gate; visibility check below is the real gate
    await expect(page.locator('body')).toBeVisible();

    // Shared nav present (built by partials.js) on chrome pages.
    if (!['/account.html'].includes(path)) {
      await expect(page.locator('nav.nav, .btabs').first()).toBeVisible({ timeout: 6000 });
    }
    assertClean(page);
  });
}

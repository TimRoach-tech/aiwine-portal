// Portal fixtures: force DEMO mode + fail on console/page errors.
// The live config.js ships real Supabase keys → the portal would show a login
// screen. We intercept config.js and return a keyless config so store.js runs on
// sample data (no auth, no live writes) — exactly what CI should exercise.
const base = require('@playwright/test');

const DEMO_CONFIG = `window.PORTAL_CONFIG = { APP_NAME: "AIWine Winery Portal (CI demo)", WINERY_APP_URL: "#", STRIPE_LINKS: {} };`;

const test = base.test.extend({
  page: async ({ page }, use) => {
    await page.route('**/config.js', (route) =>
      route.fulfill({ status: 200, contentType: 'application/javascript', body: DEMO_CONFIG })
    );
    const errors = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    page.__errors = errors;
    await use(page);
  },
});

const expect = base.expect;

function assertClean(page, allow = []) {
  const real = (page.__errors || []).filter((e) => !allow.some((a) => e.includes(a)));
  expect(real, 'unexpected console/page errors:\n' + real.join('\n')).toEqual([]);
}

// Boot the portal into the demo shell and wait for the dashboard heading.
async function boot(page) {
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.topbar .demo')).toContainText('Demo', { timeout: 10_000 });
  await expect(page.locator('h1.page-title')).toBeVisible();
}

module.exports = { test, expect, assertClean, boot };

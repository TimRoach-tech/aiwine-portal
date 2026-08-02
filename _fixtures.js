// Shared fixtures + helpers for the AIWine smoke suite.
// The site is behind a preview password gate until go-live; every test sets the
// access flag (and age-gate) in localStorage BEFORE the page scripts run, so the
// gate never hides the page under test. We seed it via addInitScript.
const base = require('@playwright/test');

const seedAccess = `
  try {
    localStorage.setItem('aiwine:access', '1');
    localStorage.setItem('aiwine:age-verified', '1');
  } catch (e) {}
`;

const test = base.test.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(seedAccess);
    // Fail the test on any uncaught page error or console error (real regressions).
    const errors = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    page.__errors = errors;
    await use(page);
  },
});

const expect = base.expect;

// Assert no console/page errors accumulated (call at end of a test).
function assertClean(page, allow = []) {
  const real = (page.__errors || []).filter(
    (e) => !allow.some((a) => e.includes(a))
  );
  expect(real, 'unexpected console/page errors:\n' + real.join('\n')).toEqual([]);
}

module.exports = { test, expect, assertClean };

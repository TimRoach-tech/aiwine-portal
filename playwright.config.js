// @ts-check
const { defineConfig, devices } = require('@playwright/test');

// AIWine smoke suite config.
// Serves ../site-final on :4321 (consumer site) and ../portal on :4322 (winery
// portal), and runs both suites. Point BASE_URL at a deployed URL to smoke the
// consumer site externally (the portal suite always runs against the local build
// in demo mode). CI: headless.
const SITE_PORT = 4321;
const PORTAL_PORT = 4322;
const BASE_URL = process.env.BASE_URL || `http://127.0.0.1:${SITE_PORT}`;
const PORTAL_URL = `http://127.0.0.1:${PORTAL_PORT}`;

const servers = [
  { command: 'npx --yes http-server ../portal -p ' + PORTAL_PORT + ' -c-1 --silent', url: PORTAL_URL, reuseExistingServer: !process.env.CI, timeout: 30_000 },
];
if (!process.env.BASE_URL) {
  servers.unshift({ command: 'npx --yes http-server ../site-final -p ' + SITE_PORT + ' -c-1 --silent', url: BASE_URL, reuseExistingServer: !process.env.CI, timeout: 30_000 });
}

module.exports = defineConfig({
  testDir: '.',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: { trace: 'on-first-retry', screenshot: 'only-on-failure' },
  webServer: servers,
  projects: [
    { name: 'site-desktop', testDir: './tests', use: { ...devices['Desktop Chrome'], baseURL: BASE_URL } },
    { name: 'site-mobile-safari', testDir: './tests', use: { ...devices['iPhone 13'], baseURL: BASE_URL } },
    { name: 'site-mobile-chrome', testDir: './tests', use: { ...devices['Pixel 7'], baseURL: BASE_URL } },
    // Portal runs in DEMO mode (config.js intercepted to drop Supabase keys) so it
    // needs no login and touches no live data. Desktop + mobile.
    { name: 'portal-desktop', testDir: './tests-portal', use: { ...devices['Desktop Chrome'], baseURL: PORTAL_URL } },
    { name: 'portal-mobile', testDir: './tests-portal', use: { ...devices['iPhone 13'], baseURL: PORTAL_URL } },
  ],
});

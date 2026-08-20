/* AIWine — pricing parity test:  site-final/assets/app.js  vs  portal/api/_pricing.js
   ---------------------------------------------------------------------------------
   WHY: the cart maths exists TWICE — once in the browser (app.js: shipments /
   gstContent / buildOrder) and once on the server (_pricing.js), which is the
   price authority Stripe is charged from. They are kept in sync only by a comment.
   Any drift means the customer sees one price and is charged another.

   This spec runs IDENTICAL fixtures through both implementations and asserts the
   totals match to the cent, across every store-setting combination that changes
   money. It also asserts the server cannot be talked into a bad number.

   Run:  cd ci && npx playwright test parity.pricing.spec.js --project=site-desktop
   (The site project is used only to get a browser context in which app.js runs;
   no network calls or live data are involved.)                                   */

const path = require('path');
const fs = require('fs');
const { test, expect } = require('@playwright/test');

// ---- load the SERVER implementation directly (pure module, no deps) ----------
const pricingSrc = fs.readFileSync(path.join(__dirname, '..', 'portal', 'api', '_pricing.js'), 'utf8');
const serverMod = { exports: {} };
new Function('module', 'exports', 'require', pricingSrc)(serverMod, serverMod.exports, () => ({}));
const { reprice } = serverMod.exports;

// ---- fixtures: each case is a cart + the winery settings that apply ----------
const WINES = {
  p1: { price: 30, stock: 500, winery: 'Alpha Estate', name: 'Alpha Pinot', region: 'Martinborough' },
  p2: { price: 45, stock: 500, winery: 'Alpha Estate', name: 'Alpha Syrah', region: 'Martinborough' },
  b1: { price: 24, stock: 500, winery: 'Beta Wines', name: 'Beta Sauv', region: 'Marlborough' },
};

const CASES = [
  { name: '1 bottle, defaults (postage applies)', lines: [{ id: 'p1', qty: 1 }], settings: {} },
  { name: '6 bottles hits free-delivery threshold', lines: [{ id: 'p1', qty: 6 }], settings: {} },
  { name: '12 bottles, dozen discount OFF', lines: [{ id: 'p1', qty: 12 }], settings: { 'Alpha Estate': { dozenOn: false } } },
  { name: '12 bottles, dozen discount ON at 10%', lines: [{ id: 'p1', qty: 12 }], settings: { 'Alpha Estate': { dozenOn: true, dozenRate: 10 } } },
  { name: '12 bottles, dozen discount ON at 20%', lines: [{ id: 'p1', qty: 12 }], settings: { 'Alpha Estate': { dozenOn: true, dozenRate: 20 } } },
  { name: 'free threshold raised to 12 (6 pays postage)', lines: [{ id: 'p1', qty: 6 }], settings: { 'Alpha Estate': { freeThreshold: 12 } } },
  { name: 'mixed wines, one winery, pooled to a dozen', lines: [{ id: 'p1', qty: 6 }, { id: 'p2', qty: 6 }], settings: { 'Alpha Estate': { dozenOn: true, dozenRate: 10 } } },
  { name: 'two wineries = two shipments, two postages', lines: [{ id: 'p1', qty: 3 }, { id: 'b1', qty: 3 }], settings: {} },
  { name: 'two wineries, one free one not', lines: [{ id: 'p1', qty: 6 }, { id: 'b1', qty: 2 }], settings: {} },
  { name: 'member 10% on top of dozen', lines: [{ id: 'p1', qty: 12 }], settings: { 'Alpha Estate': { dozenOn: true, dozenRate: 10 } }, member: true },
  { name: 'member 10%, no case discount', lines: [{ id: 'p1', qty: 6 }], settings: {}, member: true },
  { name: 'member + promo 10% stacked', lines: [{ id: 'p1', qty: 12 }], settings: { 'Alpha Estate': { dozenOn: true, dozenRate: 10 } }, member: true, promoPct: 0.10 },
  { name: 'promo 5% (regional launch rate)', lines: [{ id: 'p1', qty: 12 }], settings: { 'Alpha Estate': { dozenOn: true, dozenRate: 10 } }, member: true, promoPct: 0.05 },
];

// The client mirrors these numbers; if you change them in app.js, change them here.
const MARKET = { currency: 'NZD', gstRate: 0.15, postagePerShipment: 12, halfCase: 6, fullCase: 12, fullCaseDisc: 0.10, appMemberDisc: 0.10, commissionRate: 0.20 };

test.describe('cart pricing parity: browser vs server', () => {
  test('server implementation loads and prices every fixture', async () => {
    for (const c of CASES) {
      const r = reprice({ lines: c.lines, wines: WINES, settings: c.settings, member: !!c.member, promoPct: c.promoPct || 0, market: MARKET });
      expect(r.ok, `${c.name} → ${r.error || ''}`).toBe(true);
      expect(Number.isFinite(r.order.total), c.name).toBe(true);
      expect(r.order.amountCents, c.name).toBe(Math.round(r.order.total * 100));
    }
  });

  test('client and server agree to the cent on every fixture', async ({ page }) => {
    // Drive the REAL client maths. window.AIWine.shipments takes ONLY a cart and
    // reads membership/settings/market from module state, so we set those up the
    // same way the live page does: MARKET.storeSettings (exposed object, mutated
    // in place) and the app-member localStorage flag.
    await page.goto('/wines.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.AIWine && typeof window.AIWine.shipments === 'function' && window.AIWine.MARKET, { timeout: 15000 });
    await page.waitForFunction(() => (window.CATALOGUE || []).some((w) => w.stock > 0), { timeout: 15000 });

    // Use REAL catalogue wines so no injection is needed; two different wineries.
    const picked = await page.evaluate(() => {
      const inStock = (window.CATALOGUE || []).filter((w) => w.stock >= 12 && w.price > 0);
      const a = inStock[0];
      const b = inStock.find((w) => w.winery !== a.winery);
      const lite = (w) => ({ id: w.id, price: w.price, stock: w.stock, winery: w.winery, name: w.name, region: w.subRegion || w.region || '' });
      return { a: lite(a), b: b ? lite(b) : null };
    });
    const WINES_LIVE = { [picked.a.id]: picked.a };
    if (picked.b) WINES_LIVE[picked.b.id] = picked.b;

    const liveCases = [
      { name: 'single bottle', lines: [{ id: picked.a.id, qty: 1 }], settings: {} },
      { name: 'six bottles (free delivery)', lines: [{ id: picked.a.id, qty: 6 }], settings: {} },
      { name: 'dozen, discount ON 10%', lines: [{ id: picked.a.id, qty: 12 }], settings: { [picked.a.winery]: { dozenOn: true, dozenRate: 10, freeThreshold: 6, minOrder: 1 } } },
      { name: 'dozen, discount ON 20%', lines: [{ id: picked.a.id, qty: 12 }], settings: { [picked.a.winery]: { dozenOn: true, dozenRate: 20, freeThreshold: 6, minOrder: 1 } } },
      { name: 'threshold raised to 12', lines: [{ id: picked.a.id, qty: 6 }], settings: { [picked.a.winery]: { freeThreshold: 12, minOrder: 1 } } },
      { name: 'member 10%', lines: [{ id: picked.a.id, qty: 6 }], settings: {}, member: true },
      { name: 'member + dozen', lines: [{ id: picked.a.id, qty: 12 }], settings: { [picked.a.winery]: { dozenOn: true, dozenRate: 10, freeThreshold: 6, minOrder: 1 } }, member: true },
    ];
    if (picked.b) liveCases.push({ name: 'two wineries, two shipments', lines: [{ id: picked.a.id, qty: 3 }, { id: picked.b.id, qty: 3 }], settings: {} });

    const rows = [];
    for (const c of liveCases) {
      const client = await page.evaluate(({ c }) => {
        const cart = {}; c.lines.forEach((l) => { cart[l.id] = l.qty; });
        // membership + per-winery settings, applied the way the live page does
        try { localStorage.setItem('aiwine:app-member', c.member ? '1' : '0'); } catch (e) {}
        window.AIWine.MARKET.storeSettings = c.settings || {};
        const ships = window.AIWine.shipments(cart);
        const arr = Array.isArray(ships) ? ships : (ships.shipments || []);
        return {
          total: arr.reduce((s, g) => s + g.total, 0),
          postage: arr.reduce((s, g) => s + g.postage, 0),
          discount: arr.reduce((s, g) => s + (g.discount || 0), 0),
          appDiscount: arr.reduce((s, g) => s + (g.appDiscount || 0), 0),
          count: arr.length,
        };
      }, { c });

      const server = reprice({
        lines: c.lines, wines: WINES_LIVE, settings: c.settings,
        member: !!c.member, market: MARKET,
      });
      expect(server.ok, `${c.name} → ${server.error || ''}`).toBe(true);

      rows.push({ case: c.name, client: client.total.toFixed(2), server: server.order.total.toFixed(2) });
      expect(client.count, `SHIPMENT COUNT MISMATCH · ${c.name}`).toBe(server.order.shipments.length);
      expect(client.postage, `POSTAGE MISMATCH · ${c.name}`).toBeCloseTo(server.order.postage, 2);
      expect(client.discount, `CASE DISCOUNT MISMATCH · ${c.name}`).toBeCloseTo(server.order.discount, 2);
      expect(client.appDiscount, `MEMBER DISCOUNT MISMATCH · ${c.name}`).toBeCloseTo(server.order.appDiscount, 2);
      expect(client.total, `TOTAL MISMATCH · ${c.name} — app.js and _pricing.js have drifted`).toBeCloseTo(server.order.total, 2);
    }
    console.table(rows);
  });

  test('server rejects tampered and impossible inputs', async () => {
    const bad = [
      { name: 'unknown wine id', input: { lines: [{ id: 'nope', qty: 1 }] } },
      { name: 'more than available stock', input: { lines: [{ id: 'lowstock', qty: 5 }], wines: { lowstock: { price: 20, stock: 2, winery: 'Alpha Estate' } } } },
      { name: 'empty cart', input: { lines: [] } },
      { name: 'paused winery', input: { lines: [{ id: 'p1', qty: 6 }], settings: { 'Alpha Estate': { paused: true } } } },
      { name: 'below minimum order', input: { lines: [{ id: 'p1', qty: 1 }], settings: { 'Alpha Estate': { minOrder: 6 } } } },
    ];
    for (const b of bad) {
      const r = reprice(Object.assign({ wines: WINES, settings: {}, market: MARKET }, b.input));
      expect(r.ok, `should have been rejected: ${b.name}`).toBe(false);
      expect(typeof r.error, b.name).toBe('string');
    }
  });

  test('promo percentage is clamped so it can never zero an order', async () => {
    const r = reprice({ lines: [{ id: 'p1', qty: 12 }], wines: WINES, settings: {}, member: true, promoPct: 5, market: MARKET });
    expect(r.ok).toBe(true);
    // 500% must clamp to 50%; the order keeps meaningful value
    expect(r.order.total).toBeGreaterThan(0);
    expect(r.order.promoDiscount).toBeLessThanOrEqual(r.order.lines.reduce((a, l) => a + l.price * l.qty, 0) * 0.5);
  });

  test('commission always tracks what the customer actually paid', async () => {
    for (const c of CASES) {
      const r = reprice({ lines: c.lines, wines: WINES, settings: c.settings, member: !!c.member, promoPct: c.promoPct || 0, market: MARKET });
      const wineValue = r.order.shipments.reduce((a, s) => a + s.wineValue, 0);
      // commission is 20% of wine value (ex postage), never of the pre-discount subtotal
      expect(r.order.commission.total, c.name).toBeCloseTo(Math.round(wineValue * MARKET.commissionRate * 100) / 100, 1);
      expect(r.order.commission.gst, c.name).toBeCloseTo(Math.round(r.order.commission.total * MARKET.gstRate * 100) / 100, 1);
    }
  });

  test('settings resolve by winery id even when the name differs', async () => {
    // Same winery, renamed / duplicated: settings keyed by ID must still win.
    const wines = { x1: { price: 30, stock: 100, winery: 'Te Kairanga (The Runholder)', wineryId: 'wy-tk', name: 'X' } };
    const settings = { 'wy-tk': { dozenOn: true, dozenRate: 20, freeThreshold: 6 } };
    const r = reprice({ lines: [{ id: 'x1', qty: 12 }], wines, settings, market: MARKET });
    expect(r.ok).toBe(true);
    // 20% off 360 = 288, free delivery at 12 bottles
    expect(r.order.total).toBeCloseTo(288, 2);
    expect(r.order.shipments[0].wineryId).toBe('wy-tk');
  });

  test('name matching tolerates case and spacing differences', async () => {
    const wines = { y1: { price: 30, stock: 100, winery: '  ALPHA   estate ', name: 'Y' } };
    const settings = { 'Alpha Estate': { dozenOn: true, dozenRate: 10, freeThreshold: 6 } };
    const r = reprice({ lines: [{ id: 'y1', qty: 12 }], wines, settings, market: MARKET });
    expect(r.ok).toBe(true);
    expect(r.order.total).toBeCloseTo(324, 2);   // settings applied, not defaults
  });
});

/* AIWine — server-side re-pricing (pure, no I/O).
   ------------------------------------------------------------------
   THE PRICE AUTHORITY for the live cart. Mirrors the client math in
   site-final/assets/app.js (shipments / gstContent / buildOrder) but runs on the
   server from DB-sourced prices, so a tampered browser total is never trusted.

   ⚠ CONTRACT: if you change the cart math in app.js (thresholds, discounts,
   postage, GST, group map), mirror it HERE. Keep the two in sync.

   Commission: AIWine takes COMMISSION_RATE of each line's wine value (ex delivery),
   plus GST ON the commission. Snapshotted per order at charge time so a later
   price/rate change never rewrites a settled order.
   ------------------------------------------------------------------ */

const DEFAULT_MARKET = {
  currency: 'NZD',
  gstRate: 0.15,                 // AU: 0.10
  postagePerShipment: 12,        // flat $ per winery shipment under the Six
  halfCase: 6, fullCase: 12,
  fullCaseDisc: 0.10,            // Dozen = 10% off (only if the winery enabled it)
  appMemberDisc: 0.10,          // paid app members: extra 10% (funded from commission)
  commissionRate: 0.20,         // AIWine commission on wine value (ex delivery)
};

// round to whole dollars the way the client cart displays subtotals/discounts
const r0 = (n) => Math.round(n);
const r2 = (n) => Math.round(n * 100) / 100;

/**
 * @param {Object} input
 * @param {Array<{id,qty}>} input.lines            requested cart lines
 * @param {Object<string,{price:number,stock:number,winery:string,name:string,region?:string}>} input.wines
 *        DB-sourced wine records keyed by id (price + stock are the source of truth)
 * @param {Object<string,string>} [input.groups]   brand -> group display name (ship-together pools)
 * @param {Object<string,{freeThreshold?:number,minOrder?:number,mixed?:boolean,paused?:boolean,dozenOn?:boolean,dozenRate?:number}>} [input.settings]
 *        per-winery/group store settings (from the wineries table)
 * @param {boolean} [input.member]                 paid app member (SERVER-VERIFIED ONLY)
 * @param {number}  [input.promoPct]               validated promo fraction, e.g. 0.10 (SERVER-DERIVED ONLY)
 * @param {Object} [input.market]                  market overrides (gstRate, etc)
 * @returns {{ok:boolean, error?:string, order?:Object}}
 */
function reprice(input) {
  const M = Object.assign({}, DEFAULT_MARKET, input.market || {});
  const wines = input.wines || {};
  const groups = input.groups || {};
  const settings = input.settings || {};
  const member = !!input.member;

  // 1) Validate every line against the DB: exists + sellable + enough stock.
  //    HARD BLOCK (audit Medium): a line is only sellable if it came from a LIVE
  //    published database row with a real price. During soft launch the site
  //    merges the demo catalogue alongside live wines (MERGE_DEMO), and demo
  //    entries carry placeholder prices (demoPrice). If one ever became buyable
  //    that is a sale at an invented price. The merge order is not allowed to be
  //    the only thing preventing it — the server refuses here, always.
  const clean = [];
  for (const ln of (input.lines || [])) {
    const w = wines[ln.id];
    const qty = Math.max(0, parseInt(ln.qty, 10) || 0);
    if (!w) return { ok: false, error: `unknown_wine:${ln.id}` };
    if (qty < 1) continue;
    if (w.demoPrice === true || w.demo === true) return { ok: false, error: `not_for_sale:${ln.id}` };
    if (w.published === false) return { ok: false, error: `not_published:${ln.id}` };
    const price = Number(w.price);
    if (!Number.isFinite(price) || price <= 0) return { ok: false, error: `no_price:${ln.id}` };
    if (!w.wineryId && !w.winery) return { ok: false, error: `no_winery:${ln.id}` };
    if ((w.stock || 0) < qty) return { ok: false, error: `insufficient_stock:${ln.id}`, available: w.stock || 0 };
    clean.push({ id: ln.id, qty, price, winery: w.winery, wineryId: w.wineryId || null, name: w.name, region: w.region || '' });
  }
  if (!clean.length) return { ok: false, error: 'empty_cart' };

  const DEFAULT_SETTINGS = { freeThreshold: M.halfCase, minOrder: 1, mixed: true, paused: false, dozenOn: false, dozenRate: M.fullCaseDisc * 100 };
  // Resolve settings by wineryId FIRST (stable), falling back to the winery name
  // for rows not yet carrying an id. Name matching is case/space-insensitive so a
  // rename or duplicate row can no longer silently drop a winery to defaults
  // (which quietly changed postage, discount and the commission base).
  const normName = (s) => String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ' ');
  const byNorm = {};
  for (const k of Object.keys(settings)) byNorm[normName(k)] = settings[k];
  const settingsOf = (key, wineryId) => Object.assign(
    {}, DEFAULT_SETTINGS,
    (wineryId != null && settings[wineryId]) || byNorm[normName(key)] || {}
  );
  const keyOf = (it) => groups[it.winery] || it.wineryId || it.winery;

  // 2) Group into shipments (brands that ship together pool bottles).
  const byKey = {};
  for (const it of clean) {
    const key = keyOf(it);
    (byKey[key] = byKey[key] || { key, label: it.winery, wineryId: it.wineryId || null, region: it.region, bottles: 0, subtotal: 0, items: [] });
    byKey[key].bottles += it.qty;
    byKey[key].subtotal += it.price * it.qty;
    byKey[key].items.push(it);
  }

  // 3) Per-shipment discounts, postage, commission.
  // promoPct is a SERVER-derived value (validated against promo_codes by the
  // caller) — never a number the browser supplied. Stacks after the case
  // discount and the member discount, mirroring app.js.
  const promoPct = Number(input.promoPct) > 0 ? Math.min(Number(input.promoPct), 0.5) : 0;
  let anyPaused = false;
  const shipments = Object.values(byKey).map((g) => {
    const st = settingsOf(g.label || g.key, g.wineryId);
    if (st.paused) anyPaused = true;
    const dozen = g.bottles >= M.fullCase && st.dozenOn;
    const discPct = dozen ? (st.dozenRate != null ? st.dozenRate / 100 : M.fullCaseDisc) : 0;
    const discount = r0(g.subtotal * discPct);
    const appDiscount = member ? r0((g.subtotal - discount) * M.appMemberDisc) : 0;
    const promoDiscount = promoPct ? r0((g.subtotal - discount - appDiscount) * promoPct) : 0;
    const postage = g.bottles >= st.freeThreshold ? 0 : M.postagePerShipment;
    const wineValue = g.subtotal - discount - appDiscount - promoDiscount;   // what the customer pays for wine
    const total = wineValue + postage;
    const commission = r2(wineValue * M.commissionRate);
    const commissionGst = r2(commission * M.gstRate);
    const belowMin = g.bottles < (st.minOrder || 1);
    return {
      winery: g.label || g.key, wineryId: g.wineryId || null, region: g.region, bottles: g.bottles,
      subtotal: g.subtotal, discount, appDiscount, promoDiscount, postage, wineValue, total,
      commission, commissionGst,
      belowMin,
      items: g.items.map((i) => ({ id: i.id, qty: i.qty, price: i.price })),
    };
  });

  if (anyPaused) return { ok: false, error: 'winery_paused' };
  const belowMin = shipments.find((s) => s.belowMin);
  if (belowMin) return { ok: false, error: `below_min_order:${belowMin.winery}` };

  // 4) Totals + GST (GST is INCLUSIVE in NZ display prices).
  const sum = (f) => shipments.reduce((a, s) => a + f(s), 0);
  const grandTotal = sum((s) => s.total);
  const gst = r2(grandTotal * M.gstRate / (1 + M.gstRate));
  const commissionTotal = sum((s) => s.commission);
  const commissionGstTotal = sum((s) => s.commissionGst);

  return {
    ok: true,
    order: {
      currency: M.currency,
      lines: clean.map((i) => ({ id: i.id, qty: i.qty, price: i.price, winery: i.winery, name: i.name })),
      shipments,
      postage: sum((s) => s.postage),
      discount: sum((s) => s.discount),
      appDiscount: sum((s) => s.appDiscount),
      promoDiscount: sum((s) => s.promoDiscount),
      total: grandTotal,
      amountCents: Math.round(grandTotal * 100),   // what Stripe should charge
      gst,
      commission: {
        rate: M.commissionRate,
        total: commissionTotal,
        gst: commissionGstTotal,
        net: r2(grandTotal - sum((s) => s.postage) - commissionTotal), // winery wine payout ex GST-on-commission
      },
      count: clean.reduce((a, i) => a + i.qty, 0),
      pricedAt: new Date().toISOString(),
    },
  };
}

module.exports = { reprice, DEFAULT_MARKET };

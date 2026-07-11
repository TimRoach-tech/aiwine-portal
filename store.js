/* AIWine Winery Portal — data layer.
   One interface, two backends:
     · DEMO  — sample wines/orders in the browser (default)
     · LIVE  — Supabase, scoped to the signed-in winery by RLS
   Exposes window.PStore. Mutations write through to Supabase in live mode
   and always mutate the in-memory arrays so the UI updates instantly. */
(function () {
  const CFG = window.PORTAL_CONFIG || {};
  const LIVE = !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY);

  // ---------- demo seed (Ata Rangi, Martinborough) ----------
  const DEMO_WINES = [
    { id:'w1', name:'Crimson Pinot Noir', variety:'Pinot Noir', vintage:2023, price:32, qty:60, scans:214 },
    { id:'w2', name:'Ata Rangi Pinot Noir', variety:'Pinot Noir', vintage:2022, price:99, qty:30, scans:188 },
    { id:'w3', name:'Craighall Chardonnay', variety:'Chardonnay', vintage:2022, price:55, qty:6, scans:122 },
    { id:'w4', name:'Te Wā Sauvignon Blanc', variety:'Sauvignon Blanc', vintage:2024, price:38, qty:28, scans:71 },
    { id:'w5', name:'Summer Rosé', variety:'Rosé', vintage:2024, price:28, qty:5, scans:96 },
    { id:'w6', name:'Kahu Botrytis Riesling', variety:'Riesling', vintage:2021, price:42, qty:0, scans:34 },
  ];
  const DEMO_ORDERS = [
    { id:'AW-2041', placedAt:'25 min ago', destination:'Auckland', items:'6 × Crimson Pinot Noir', total:204, status:'new' },
    { id:'AW-2038', placedAt:'2 hours ago', destination:'Wellington', items:'3 × Ata Rangi Pinot · 2 × Te Wā', total:373, status:'new' },
    { id:'AW-2034', placedAt:'Yesterday', destination:'Christchurch', items:'12 × Crimson Pinot Noir', total:346, status:'packing' },
    { id:'AW-2029', placedAt:'2 days ago', destination:'Hamilton', items:'6 × Summer Rosé', total:163, status:'shipped' },
    { id:'AW-2021', placedAt:'4 days ago', destination:'Nelson', items:'4 × Craighall Chardonnay', total:220, status:'shipped' },
  ];

  let sb = null, session = null, wineryId = null, wineries = [],
      wineryName = LIVE ? '' : 'Ata Rangi', wineryRegion = LIVE ? '' : 'Martinborough';
  const ACTIVE_KEY = 'aiwine-portal:activeWinery';
  const Store = {
    mode: LIVE ? 'live' : 'demo',
    wines: [], orders: [],
    get wineryName() { return wineryName; },
    get wineryRegion() { return wineryRegion; },
    get userEmail() { return (session && session.user && session.user.email) || ''; },
    get wineryId() { return wineryId; },
    get wineries() { return wineries; },   // [{id,name,region}] — all wineries this login manages
    get ordersEmail() { const w = wineries.find(x => x.id === wineryId); return (w && w.ordersEmail) || ''; },
    get fulfilment() { const w = wineries.find(x => x.id === wineryId); return (w && w.fulfilment) || 'any'; },
    async setFulfilment(profile) {
      const { error } = await sb.rpc('set_fulfilment', { p_winery: wineryId, p_profile: profile });
      if (error) throw new Error(error.message);
      const w = wineries.find(x => x.id === wineryId); if (w) w.fulfilment = profile;
    },
    get planCellarDoor() { const w = wineries.find(x => x.id === wineryId); return !!(w && w.cellarDoorActive); },
    get planGrow() { const w = wineries.find(x => x.id === wineryId); return !!(w && w.growActive); },
    // redeem an activation code for the ACTIVE winery → returns the feature it unlocked
    async redeemCode(code) {
      const { data, error } = await sb.rpc('redeem_activation_code', { p_winery: wineryId, p_code: code });
      if (error) throw new Error(/invalid_code/.test(error.message) ? 'That code isn\u2019t valid.' : error.message);
      const w = wineries.find(x => x.id === wineryId);
      if (w) { if (data === 'grow') w.growActive = true; else w.cellarDoorActive = true; }
      return data;
    },
    // re-read plan flags for the active winery (e.g. after returning from Stripe)
    async refreshPlan() {
      const { data: w } = await sb.from('wineries').select('"cellarDoorActive","growActive","ordersEmail",fulfilment').eq('id', wineryId).maybeSingle();
      const cur = wineries.find(x => x.id === wineryId);
      if (w && cur) Object.assign(cur, w);
      return Store.planCellarDoor || Store.planGrow;
    },
    async setOrdersEmail(email) {
      const { error } = await sb.rpc('set_orders_email', { p_winery: wineryId, p_email: email || '' });
      if (error) throw new Error(/invalid_email/.test(error.message) ? 'That doesn\u2019t look like a valid email address.' : error.message);
      const w = wineries.find(x => x.id === wineryId); if (w) w.ordersEmail = email;
    },
    // switch which winery the portal is editing (multi-winery logins)
    async setActiveWinery(id) {
      const w = wineries.find(x => x.id === id); if (!w) return;
      wineryId = w.id; wineryName = w.name; wineryRegion = w.region || '';
      try { localStorage.setItem(ACTIVE_KEY, id); } catch (e) {}
      await Store.reload();
    },

    // ---- boot: load Supabase lib + restore session (live) or seed (demo) ----
    async init() {
      if (!LIVE) {
        Store.wines = DEMO_WINES.map(w => ({ ...w }));
        Store.orders = DEMO_ORDERS.map(o => ({ ...o }));
        return { ok: true, demo: true };
      }
      await loadLib();
      sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
      const { data } = await sb.auth.getSession();
      session = data && data.session;
      if (!session) return { ok: false, needsAuth: true };
      await loadWinery();
      if (!wineryId) return { ok: true, needsSetup: true };  // signed in, not yet linked to a winery
      await Store.reload();
      return { ok: true };
    },
    async signUp(email, password) {
      if (!sb) { await loadLib(); sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY); }
      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) throw new Error(error.message);
      session = data.session;                 // null when “Confirm email” is on
      return { needsVerify: !data.session };
    },
    // winery submits (or updates) its request to join — lands in the CRM queue
    async requestAccess(p) {
      const { data, error } = await sb.rpc('request_winery_access', {
        p_name: p.name, p_region: p.region || null, p_website: p.website || null,
        p_contact: p.contact || null, p_message: p.message || null, p_country: p.country || 'NZ',
      });
      if (error) throw new Error(error.message);
      return data;   // 'pending' | 'linked'
    },
    // the signed-in user's own request (RLS returns only their row), or null
    async myRequest() {
      const { data } = await sb.from('winery_signup_requests')
        .select('status,"wineryName"').limit(1).maybeSingle();
      return data || null;
    },
    async signIn(email, password) {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      session = data.session;
      await loadWinery();
      if (!wineryId) return { needsSetup: true };
      await Store.reload();
      return { ok: true };
    },
    async signOut() { if (sb) await sb.auth.signOut(); session = null; },

    async reload() {
      if (!LIVE) return;
      const [w, o] = await Promise.all([
        sb.from('wines').select('*').eq('wineryId', wineryId).order('name'),
        sb.from('orders').select('*, order_items(*)').eq('wineryId', wineryId).order('placedAt', { ascending: false }),
      ]);
      Store.wines = (w.data || []).map(normWine);
      Store.orders = (o.data || []).map(normOrder);
    },

    // ---- mutations (write-through) ----
    async updateWine(id, patch) {
      const w = Store.wines.find(x => x.id === id); if (w) Object.assign(w, patch);
      if (LIVE) {
        const db = Object.assign({}, patch);
        if (db.qty !== undefined) { db.stock = db.qty; delete db.qty; } // table column is `stock`
        await sb.from('wines').update(db).eq('id', id);
      }
    },
    async addWine(w) {
      Store.wines.unshift(w);
      if (LIVE) {
        const row = {
          name: w.name, variety: w.variety, colour: w.colour || null, style: w.style || null,
          vintage: w.vintage, price: w.price, stock: w.qty, organic: !!w.organic,
          notes: w.notes || null, pairings: (w.pairings && w.pairings.length) ? w.pairings : null,
          awards: w.awards ? String(w.awards).split(';').map(s => s.trim()).filter(Boolean) : null,
          region: w.region || wineryRegion, "subRegion": w.subRegion || null,
          published: true, wineryId,
        };
        const { data } = await sb.from('wines').insert(row).select().single();
        if (data) w.id = data.id;
      }
    },
    async removeWine(id) {
      Store.wines = Store.wines.filter(x => x.id !== id);
      if (LIVE) await sb.from('wines').delete().eq('id', id);
    },
    async updateOrder(id, patch) {
      const o = Store.orders.find(x => x.id === id); if (o) Object.assign(o, patch);
      if (LIVE) await sb.from('orders').update(patch).eq('id', id);
    },

    // ---- bulk range publish (CSV / Excel upload → confirm) ----
    // rows: normalised objects from the upload preview
    //   { name, variety, colour, vintage, price, stock|qty, notes, pairings[], awards, style, organic, region, subRegion }
    // Existing wines (matched by name, case-insensitive) are UPDATED; the rest are ADDED.
    async bulkUpsert(rows) {
      let added = 0, updated = 0;
      for (const r of rows) {
        const name = String(r.name || '').trim();
        if (!name) continue;
        const qty = +(r.qty != null ? r.qty : r.stock) || 0;
        const price = +r.price || 0;
        const existing = Store.wines.find(x => String(x.name).toLowerCase() === name.toLowerCase());
        if (existing) {
          const patch = { price, qty };
          if (r.variety) patch.variety = r.variety;
          if (r.colour)  patch.colour  = r.colour;
          if (r.vintage) patch.vintage = +r.vintage || existing.vintage;
          await Store.updateWine(existing.id, patch);
          updated++;
        } else {
          await Store.addWine({
            id: 'tmp' + Date.now() + '-' + added, name,
            variety: r.variety, colour: r.colour, style: r.style, organic: !!r.organic,
            region: r.region, subRegion: r.subRegion, notes: r.notes,
            pairings: r.pairings || [], awards: r.awards || '',
            vintage: +r.vintage || new Date().getFullYear(), price, qty, scans: 0,
          });
          added++;
        }
      }
      if (LIVE) await Store.reload();
      return { added, updated, total: added + updated };
    },
  };

  function normWine(r) { return { id: r.id, name: r.name, variety: r.variety, colour: r.colour, vintage: r.vintage, price: +r.price || 0, qty: +r.stock || +r.qty || 0, scans: +r.scans || 0 }; }
  function normOrder(r) {
    const items = (r.order_items || []).map(i => `${i.qty} × ${i.name}`).join(' · ');
    return { id: r.id, placedAt: rel(r.placedAt), destination: r.destination, items, total: +r.total || 0, status: r.status };
  }
  function rel(ts) { if (!ts) return ''; const d = (Date.now() - new Date(ts)) / 86400000; return d < 1 ? 'today' : d < 2 ? 'yesterday' : Math.floor(d) + ' days ago'; }

  async function loadWinery() {
    const { data: maps, error } = await sb.from('winery_users').select('"wineryId"');
    if (error) { console.warn('winery_users lookup failed:', error.message); wineryId = null; wineries = []; return; }
    const ids = (maps || []).map(m => m.wineryId);
    if (!ids.length) { wineryId = null; wineries = []; return; }
    const { data: ws } = await sb.from('wineries').select('id,name,region,"ordersEmail","cellarDoorActive","growActive",fulfilment').in('id', ids).order('name');
    wineries = ws || ids.map(id => ({ id, name: 'Your winery', region: '' }));
    let pick = null;
    try { pick = localStorage.getItem(ACTIVE_KEY); } catch (e) {}
    const active = wineries.find(x => x.id === pick) || wineries[0];
    wineryId = active.id; wineryName = active.name; wineryRegion = active.region || '';
  }
  function loadLib() {
    return new Promise((res, rej) => {
      if (window.supabase) return res();
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      s.onload = res; s.onerror = () => rej(new Error('Could not load Supabase'));
      document.head.appendChild(s);
    });
  }

  window.PStore = Store;
})();

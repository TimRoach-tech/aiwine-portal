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

  let sb = null, session = null, wineryId = null, wineryName = 'Ata Rangi', wineryRegion = 'Martinborough';
  const Store = {
    mode: LIVE ? 'live' : 'demo',
    wines: [], orders: [],
    get wineryName() { return wineryName; },
    get wineryRegion() { return wineryRegion; },

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
      await Store.reload();
      return { ok: true };
    },
    async signIn(email, password) {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      session = data.session;
      await loadWinery();
      await Store.reload();
      return true;
    },
    async signOut() { if (sb) await sb.auth.signOut(); session = null; },

    async reload() {
      if (!LIVE) return;
      const [w, o] = await Promise.all([
        sb.from('wines').select('*').order('name'),
        sb.from('orders').select('*, order_items(*)').order('placedAt', { ascending: false }),
      ]);
      Store.wines = (w.data || []).map(normWine);
      Store.orders = (o.data || []).map(normOrder);
    },

    // ---- mutations (write-through) ----
    async updateWine(id, patch) {
      const w = Store.wines.find(x => x.id === id); if (w) Object.assign(w, patch);
      if (LIVE) await sb.from('wines').update(patch).eq('id', id);
    },
    async addWine(w) {
      Store.wines.unshift(w);
      if (LIVE) {
        const row = { name: w.name, variety: w.variety, vintage: w.vintage, price: w.price, qty: w.qty, wineryId };
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
  };

  function normWine(r) { return { id: r.id, name: r.name, variety: r.variety, vintage: r.vintage, price: +r.price || 0, qty: +r.qty || 0, scans: +r.scans || 0 }; }
  function normOrder(r) {
    const items = (r.order_items || []).map(i => `${i.qty} × ${i.name}`).join(' · ');
    return { id: r.id, placedAt: rel(r.placedAt), destination: r.destination, items, total: +r.total || 0, status: r.status };
  }
  function rel(ts) { if (!ts) return ''; const d = (Date.now() - new Date(ts)) / 86400000; return d < 1 ? 'today' : d < 2 ? 'yesterday' : Math.floor(d) + ' days ago'; }

  async function loadWinery() {
    const { data: map } = await sb.from('winery_users').select('wineryId').limit(1).maybeSingle();
    wineryId = map ? map.wineryId : null;
    if (wineryId) {
      const { data: w } = await sb.from('wineries').select('name,region').eq('id', wineryId).maybeSingle();
      if (w) { wineryName = w.name; wineryRegion = w.region; }
    }
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

/* AIWine Winery Portal — data layer.
   One interface, two backends:
     · DEMO  — sample wines/orders in the browser (default)
     · LIVE  — Supabase, scoped to the signed-in winery by RLS
   Exposes window.PStore. Mutations write through to Supabase in live mode
   and always mutate the in-memory arrays so the UI updates instantly. */
(function () {
  const CFG = window.PORTAL_CONFIG || {};
  // DEMO override: open the portal with ?demo=1 (or ?demo) to run on sample data
  // with NO Supabase — the login accepts any email/password. For presentations.
  const FORCE_DEMO = (() => { try { return new URLSearchParams(location.search).has('demo'); } catch(e){ return false; } })();
  const LIVE = !FORCE_DEMO && !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY);
  let demoAuthed = false;

  // ---------- demo seed (Ata Rangi, Martinborough) ----------
  const DEMO_WINES = [
    { id:'w1', name:'Crimson Pinot Noir', variety:'Pinot Noir', vintage:2023, price:32, qty:60, scans:0 },
    { id:'w2', name:'Ata Rangi Pinot Noir', variety:'Pinot Noir', vintage:2022, price:99, qty:30, scans:0 },
    { id:'w3', name:'Craighall Chardonnay', variety:'Chardonnay', vintage:2022, price:55, qty:6, scans:0 },
    { id:'w4', name:'Te Wā Sauvignon Blanc', variety:'Sauvignon Blanc', vintage:2024, price:38, qty:28, scans:0 },
    { id:'w5', name:'Summer Rosé', variety:'Rosé', vintage:2024, price:28, qty:5, scans:0 },
    { id:'w6', name:'Kahu Botrytis Riesling', variety:'Riesling', vintage:2021, price:42, qty:0, scans:0 },
  ];
  const DEMO_ORDERS = [];

  let sb = null, session = null;
  // Multi-site: one login can manage several winery sites. `sites` holds them all;
  // `activeWineryId` is the one currently shown in the portal.
  let sites = [];
  let activeWineryId = null;
  const ACTIVE_KEY = 'aiwine:activeSite';
  const activeSite = () => sites.find(s => s.id === activeWineryId) || sites[0] || null;
  const Store = {
    mode: LIVE ? 'live' : 'demo',
    wines: [], orders: [],
    get wineryName() { const s = activeSite(); return s ? s.name : 'Ata Rangi'; },
    get wineryRegion() { const s = activeSite(); return s ? s.region : 'Martinborough'; },
    get sites() { return sites; },
    get activeWineryId() { return activeWineryId; },
    get activeSite() { return activeSite(); },

    // ---- boot: load Supabase lib + restore session (live) or seed (demo) ----
    async init() {
      if (!LIVE) {
        // In ?demo mode, gate behind the login first so the demo shows a real sign-in.
        if (FORCE_DEMO && !demoAuthed) return { ok: false, needsAuth: true };
        Store.wines = DEMO_WINES.map(w => ({ ...w }));
        Store.orders = DEMO_ORDERS.map(o => ({ ...o }));
        return { ok: true, demo: true };
      }
      await loadLib();
      sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
      const { data } = await sb.auth.getSession();
      session = data && data.session;
      if (!session) return { ok: false, needsAuth: true };
      await loadSites();
      await Store.reload();
      return { ok: true };
    },
    async signIn(email, password) {
      if (!LIVE) {                       // demo: accept any credentials
        if (!(email || '').trim()) throw new Error('Enter any email to continue.');
        demoAuthed = true;
        Store.wines = DEMO_WINES.map(w => ({ ...w }));
        Store.orders = DEMO_ORDERS.map(o => ({ ...o }));
        return true;
      }
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      session = data.session;
      await loadSites();
      await Store.reload();
      return true;
    },
    async signUp(wineryName, region, email, password, orderEmail) {
      if (!LIVE) throw new Error('Sign-up is available on the live portal.');
      wineryName = (wineryName || '').trim();
      if (!wineryName) throw new Error('Enter your winery name.');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((email || '').trim())) throw new Error('Enter a valid email.');
      if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');
      orderEmail = (orderEmail || '').trim();
      if (orderEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(orderEmail)) throw new Error('Enter a valid order email (or leave it blank to use your login email).');
      const meta = {
        winery_name: wineryName, winery_region: (region || '').trim(),
        order_email: orderEmail,            // where orders go — may differ from the login
      };
      const { data, error } = await sb.auth.signUp({
        email: email.trim(), password,
        options: { data: meta },
      });
      if (error) throw new Error(error.message);
      session = data.session;
      if (session) {            // email confirmation OFF — straight in
        await loadSites();
        await Store.reload();
        return { ok: true, session: true };
      }
      return { ok: true, session: false };   // needs to confirm email first
    },
    async signOut() { demoAuthed = false; if (sb) await sb.auth.signOut(); session = null; },

    async resendConfirmation(email) {
      if (!LIVE) throw new Error('Available on the live portal.');
      const e = (email || '').trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) throw new Error('Enter your email above first.');
      const { error } = await sb.auth.resend({ type: 'signup', email: e });
      if (error) throw new Error(error.message);
      return true;
    },
    async resetPassword(email) {
      if (!LIVE) throw new Error('Password reset is available on the live portal.');
      const e = (email || '').trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) throw new Error('Enter the email for your winery login.');
      const { error } = await sb.auth.resetPasswordForEmail(e, { redirectTo: location.origin + location.pathname });
      if (error) throw new Error(error.message);
      return true;
    },
    async updatePassword(pw) {
      if (!LIVE) throw new Error('Password reset is available on the live portal.');
      if (!pw || pw.length < 6) throw new Error('Password must be at least 6 characters.');
      const { error } = await sb.auth.updateUser({ password: pw });
      if (error) throw new Error(error.message);
      return true;
    },

    async reload() {
      if (!LIVE) return;
      if (!activeWineryId) await loadSites();
      // RLS returns rows for ALL the operator's sites; the portal shows ONE active
      // site at a time, so scope each query to it.
      let wq = sb.from('wines').select('*').order('name');
      let oq = sb.from('orders').select('*, order_items(*)').order('placedAt', { ascending: false });
      if (activeWineryId) { wq = wq.eq('wineryId', activeWineryId); oq = oq.eq('wineryId', activeWineryId); }
      const [w, o] = await Promise.all([wq, oq]);
      Store.wines = (w.data || []).map(normWine);
      Store.orders = (o.data || []).map(normOrder);
    },

    // ---- multi-site ----
    async setActiveSite(id) {
      if (!sites.find(s => s.id === id)) return;
      activeWineryId = id;
      try { localStorage.setItem(ACTIVE_KEY, id); } catch (e) {}
      await Store.reload();
    },
    async addSite(site) {
      if (!LIVE) throw new Error('Adding a site is available on the live portal.');
      site = site || {};
      const name = (site.name || '').trim();
      if (!name) throw new Error('Enter a name for the new site.');
      const { data, error } = await sb.rpc('add_site', {
        p_name: name, p_region: (site.region || '').trim(), p_address: (site.address || '').trim(),
        p_order_email: (site.orderEmail || '').trim(),
      });
      if (error) throw new Error(error.message);
      await loadSites();
      if (data) await Store.setActiveSite(data);
      return data;
    },
    async updateOrderEmail(email) {
      if (!LIVE) return;
      if (!activeWineryId) await loadSites();
      if (!activeWineryId) return;
      email = (email || '').trim();
      if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Enter a valid order email.');
      await sb.from('wineries').update({ order_email: email || null }).eq('id', activeWineryId);
      const s = activeSite(); if (s) s.orderEmail = email;
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
          region: w.region || Store.wineryRegion, "subRegion": w.subRegion || null,
          image: w.image || null,
          published: true, wineryId: activeWineryId,
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
  };

  function normWine(r) { return { id: r.id, name: r.name, variety: r.variety, colour: r.colour, vintage: r.vintage, price: +r.price || 0, qty: +r.stock || +r.qty || 0, scans: +r.scans || 0, image: r.image || null }; }
  function normOrder(r) {
    const items = (r.order_items || []).map(i => `${i.qty} × ${i.name}`).join(' · ');
    return { id: r.id, placedAt: rel(r.placedAt), destination: r.destination, items, total: +r.total || 0, status: r.status };
  }
  function rel(ts) { if (!ts) return ''; const d = (Date.now() - new Date(ts)) / 86400000; return d < 1 ? 'today' : d < 2 ? 'yesterday' : Math.floor(d) + ' days ago'; }

  // Load EVERY winery this login manages (multi-site), pick the active one.
  async function loadSites() {
    const { data: maps } = await sb.from('winery_users').select('wineryId, isPrimary');
    const ids = (maps || []).map(m => m.wineryId).filter(Boolean);
    if (!ids.length) { sites = []; activeWineryId = null; return; }
    const primaryId = (maps.find(m => m.isPrimary) || {}).wineryId || ids[0];
    const { data: rows } = await sb.from('wineries')
      .select('id,name,region,address,order_email')
      .in('id', ids);
    const byId = {}; (rows || []).forEach(r => { byId[r.id] = r; });
    sites = ids.map(id => {
      const r = byId[id] || {};
      return { id, name: r.name || 'Winery', region: r.region || '', address: r.address || '',
        orderEmail: r.order_email || '', isPrimary: id === primaryId };
    });
    let saved = null; try { saved = localStorage.getItem(ACTIVE_KEY); } catch (e) {}
    activeWineryId = (saved && sites.find(s => s.id === saved)) ? saved : primaryId;
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

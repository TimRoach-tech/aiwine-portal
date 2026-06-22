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
    { id:'w1', name:'Crimson Pinot Noir', variety:'Pinot Noir', vintage:2023, price:32, qty:60, scans:0 },
    { id:'w2', name:'Ata Rangi Pinot Noir', variety:'Pinot Noir', vintage:2022, price:99, qty:30, scans:0 },
    { id:'w3', name:'Craighall Chardonnay', variety:'Chardonnay', vintage:2022, price:55, qty:6, scans:0 },
    { id:'w4', name:'Te Wā Sauvignon Blanc', variety:'Sauvignon Blanc', vintage:2024, price:38, qty:28, scans:0 },
    { id:'w5', name:'Summer Rosé', variety:'Rosé', vintage:2024, price:28, qty:5, scans:0 },
    { id:'w6', name:'Kahu Botrytis Riesling', variety:'Riesling', vintage:2021, price:42, qty:0, scans:0 },
  ];
  const DEMO_ORDERS = [];

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
    async signUp(wineryName, region, email, password, licence) {
      if (!LIVE) throw new Error('Sign-up is available on the live portal.');
      wineryName = (wineryName || '').trim();
      if (!wineryName) throw new Error('Enter your winery name.');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((email || '').trim())) throw new Error('Enter a valid email.');
      if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');
      licence = licence || {};
      // Off-licence is required to sell alcohol through AIWine (winery is the seller).
      if (!(licence.number || '').trim()) throw new Error('Enter your off-licence number — it appears on every wine listing.');
      const meta = {
        winery_name: wineryName, winery_region: (region || '').trim(),
        off_licence_number: (licence.number || '').trim(),
        off_licence_expiry: (licence.expiry || '').trim(),
        off_licence_authority: (licence.authority || '').trim(),
      };
      const { data, error } = await sb.auth.signUp({
        email: email.trim(), password,
        options: { data: meta },
      });
      if (error) throw new Error(error.message);
      session = data.session;
      if (session) {            // email confirmation OFF — straight in
        await loadWinery();
        await Store.reload();
        return { ok: true, session: true };
      }
      return { ok: true, session: false };   // needs to confirm email first
    },
    async signOut() { if (sb) await sb.auth.signOut(); session = null; },

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
    // ---- off-licence (winery record) ----
    async updateLicence(fields) {
      if (!LIVE) return;
      if (!wineryId) await loadWinery();
      if (!wineryId) return;
      const row = {};
      if (fields.number !== undefined)    row.off_licence_number = fields.number || null;
      if (fields.expiry !== undefined)    row.off_licence_expiry = fields.expiry || null;
      if (fields.authority !== undefined) row.off_licence_authority = fields.authority || null;
      if (fields.address !== undefined)   row.address = fields.address || null;
      if (fields.certUrl !== undefined)   row.off_licence_cert_url = fields.certUrl || null;
      await sb.from('wineries').update(row).eq('id', wineryId);
    },
    // Upload the off-licence certificate to public Storage, save its URL on the winery.
    async uploadLicenceCert(file) {
      if (!LIVE || !file) return null;
      if (!wineryId) await loadWinery();
      if (!wineryId) throw new Error('No winery to attach the certificate to yet.');
      const ext = ((file.name || '').split('.').pop() || 'pdf').toLowerCase().replace(/[^a-z0-9]/g, '') || 'pdf';
      const path = wineryId + '/off-licence.' + ext;
      const up = await sb.storage.from('winery-licences')
        .upload(path, file, { upsert: true, contentType: file.type || undefined });
      if (up.error) throw new Error(up.error.message);
      const { data } = sb.storage.from('winery-licences').getPublicUrl(path);
      const url = (data && data.publicUrl) || null;
      if (url) await sb.from('wineries').update({ off_licence_cert_url: url }).eq('id', wineryId);
      return url;
    },
  };

  function normWine(r) { return { id: r.id, name: r.name, variety: r.variety, colour: r.colour, vintage: r.vintage, price: +r.price || 0, qty: +r.stock || +r.qty || 0, scans: +r.scans || 0 }; }
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

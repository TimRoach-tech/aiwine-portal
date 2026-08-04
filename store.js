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
    { id:'AW-2041', placedAt:'25 min ago', destination:'Auckland', items:'6 × Crimson Pinot Noir', total:204, status:'new', gifts:{ 'Ata Rangi': { wrap:true, message:'Happy 40th Dad — enjoy every drop! Love the whanau x' } } },
    { id:'AW-2038', placedAt:'2 hours ago', destination:'Cellar-door pickup', items:'3 × Ata Rangi Pinot · 2 × Te Wā', total:373, status:'new', method:'pickup' },
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
      let { error } = await sb.rpc('set_fulfilment', { p_winery: wineryId, p_profile: profile });
      if (error && /(function|does not exist|PGRST202|schema cache|not_authoris|not_authoriz)/i.test(error.message)) {
        // RPC not deployed or its auth check rejects — write the column directly
        // (governed by the wineries RLS row policy).
        ({ error } = await sb.from('wineries').update({ fulfilment: profile }).eq('id', wineryId));
      }
      if (error) throw new Error(error.message);
      const w = wineries.find(x => x.id === wineryId); if (w) w.fulfilment = profile;
    },
    // Full per-winery store settings (freeThreshold, minOrder, mixed, paused,
    // pausedUntil, dozenOn, dozenRate, allocOn, allocCap, allocWines, pickup,
    // giftMsg, giftWrap). Persisted via the set_store_settings RPC when live.
    get storeSettings() {
      const w = wineries.find(x => x.id === wineryId) || {};
      return {
        freeThreshold: w.free_threshold ?? 6, minOrder: w.min_order ?? 1,
        mixed: w.mixed_cases ?? true, paused: !!w.paused, pausedUntil: w.paused_until || '',
        dozenOn: !!w.dozen_on, dozenRate: (w.dozen_rate ?? 10),
        tiers: w.tiers || [],
        allocOn: !!w.alloc_on, allocCap: w.alloc_cap ?? 6, allocWines: w.alloc_wines || [],
        pickup: w.local_pickup ?? true, giftMsg: !!w.gift_message, giftWrap: !!w.gift_wrap,
      };
    },
    async setStoreSettings(s) {
      let { data, error } = await sb.rpc('set_store_settings', { p_winery: wineryId, p_settings: s });
      if (error && /(function|does not exist|PGRST202|schema cache|not_authoris|not_authoriz)/i.test(error.message)) {
        // RPC not deployed, or its winery_users auth check rejects this user —
        // write the columns directly (governed by the wineries RLS row policy).
        ({ data, error } = await sb.from('wineries').update({
          free_threshold: s.freeThreshold, min_order: s.minOrder, mixed_cases: s.mixed,
          paused: s.paused, paused_until: s.pausedUntil || null, dozen_on: s.dozenOn,
          dozen_rate: s.dozenRate, alloc_on: s.allocOn, alloc_cap: s.allocCap,
          tiers: s.tiers || [],
          alloc_wines: s.allocWines, local_pickup: s.pickup, gift_message: s.giftMsg, gift_wrap: s.giftWrap,
        }).eq('id', wineryId).select('id'));
        if (!error && (!data || !data.length)) throw new Error('You are not linked to this winery in the database (no winery_users row for your login) — settings can\u2019t be saved. Ask an admin to link your account.');
      }
      if (error) throw new Error(error.message);
      const w = wineries.find(x => x.id === wineryId);
      if (w) Object.assign(w, {
        free_threshold: s.freeThreshold, min_order: s.minOrder, mixed_cases: s.mixed,
        paused: s.paused, paused_until: s.pausedUntil || null, dozen_on: s.dozenOn,
        dozen_rate: s.dozenRate, alloc_on: s.allocOn, alloc_cap: s.allocCap,
        tiers: s.tiers || [],
        alloc_wines: s.allocWines, local_pickup: s.pickup, gift_message: s.giftMsg, gift_wrap: s.giftWrap,
        fulfilment: s.fulfil || w.fulfilment,
      });
    },
    get planCellarDoor() { const w = wineries.find(x => x.id === wineryId); return !!(w && w.cellarDoorActive); },
    get planGrow() { const w = wineries.find(x => x.id === wineryId); return !!(w && w.growActive); },
    // Virtual Cellar Door editable content (story / hours / hero photo URL).
    get cellarInfo() {
      const w = wineries.find(x => x.id === wineryId) || {};
      return { story: w.cellar_story || '', hours: w.cellar_hours || '', image: w.cellar_image || '' };
    },
    async saveCellar(data) {
      const patch = { cellar_story: data.story || null, cellar_hours: data.hours || null };
      if (data.image !== undefined) patch.cellar_image = data.image || null;
      const { data: rows, error } = await sb.from('wineries').update(patch).eq('id', wineryId).select('id');
      if (error) throw new Error(error.message);
      if (!rows || !rows.length) throw new Error('You are not linked to this winery in the database — cellar door can\u2019t be saved. Ask an admin to link your account.');
      const w = wineries.find(x => x.id === wineryId); if (w) Object.assign(w, patch);
    },
    async uploadCellarImage(file) {
      if (!LIVE) throw new Error('demo');
      const ext = ((file.type && file.type.split('/')[1]) || 'jpg').replace('jpeg', 'jpg');
      const path = wineryId + '/cellar-hero.' + ext;
      const up = await sb.storage.from('wine-images').upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' });
      if (up.error) throw new Error(up.error.message);
      const { data } = sb.storage.from('wine-images').getPublicUrl(path);
      const url = data.publicUrl + '?t=' + Date.now();
      await Store.saveCellar(Object.assign({}, Store.cellarInfo, { image: url }));
      return url;
    },
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
      // Send the confirmation link back to the PORTAL (Supabase's Site URL points
      // at the consumer site, so without this a winery would be bounced there).
      const redirectTo = (typeof window !== 'undefined' && window.location && window.location.origin) || undefined;
      const { data, error } = await sb.auth.signUp({ email, password, options: redirectTo ? { emailRedirectTo: redirectTo } : {} });
      if (error) throw new Error(error.message);
      // Already-registered guard: with "Confirm email" on, Supabase returns a
      // fake-success (no error) for an existing email to avoid leaking who has
      // an account — the tell is an empty identities array. Surface it as a real
      // "already exists" error so the UI says "sign in" instead of "check inbox".
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        throw new Error('already registered');
      }
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
    // ---- password reset ----
    isRecovery() { return /type=recovery/.test(location.hash || ''); },
    async resetPassword(email) {
      if (!sb) { await loadLib(); sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY); }
      const e = (email || '').trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) throw new Error('Enter the email for your winery login.');
      const { error } = await sb.auth.resetPasswordForEmail(e, { redirectTo: location.origin + location.pathname });
      if (error) throw new Error(error.message);
      return true;
    },
    async setNewPassword(pw) {
      if (!sb) { await loadLib(); sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY); }
      // Policy: min 8 chars AND (letter+number OR length >= 12). Mirrors portal.js pwValid().
      const ok = (pw || '').length >= 8 && ((/[A-Za-z]/.test(pw) && /\d/.test(pw)) || (pw || '').length >= 12);
      if (!ok) throw new Error('Password must be at least 8 characters, with letters and a number (or 12+ characters).');
      const { error } = await sb.auth.updateUser({ password: pw });
      if (error) throw new Error(error.message);
      const { data } = await sb.auth.getSession(); session = data && data.session;
      try { history.replaceState(null, '', location.pathname); } catch (e) {}
      return true;
    },

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
        // Only send real wines columns, with the right types — a stray key or a
        // string where the DB wants an array silently fails the whole PATCH.
        const src = Object.assign({}, patch);
        if (src.qty !== undefined) { src.stock = src.qty; delete src.qty; } // column is `stock`
        const toArr = v => Array.isArray(v) ? v : (typeof v === 'string' ? v.split(';').map(s => s.trim()).filter(Boolean) : (v ? [v] : null));
        const ALLOWED = ['name','variety','colour','style','vintage','price','stock','organic','notes','why','region','subRegion','pairings','awards','image_url','published'];
        const db = {};
        for (const k of ALLOWED) if (src[k] !== undefined) db[k] = k === 'awards' || k === 'pairings' ? toArr(src[k]) : src[k];
        db.updated_by = Store.userEmail || null;
        db.updated_at = new Date().toISOString();
        if (w) { w.updatedBy = db.updated_by; w.updatedAt = db.updated_at; }
        const { error } = await sb.from('wines').update(db).eq('id', id);
        if (error) throw new Error(error.message);
      }
    },
    async addWine(w) {
      Store.wines.unshift(w);
      if (LIVE) {
        const who = Store.userEmail || null, now = new Date().toISOString();
        const row = {
          name: w.name, variety: w.variety, colour: w.colour || null, style: w.style || null,
          vintage: w.vintage, price: w.price, stock: w.qty, organic: !!w.organic,
          notes: w.notes || null, pairings: (w.pairings && w.pairings.length) ? w.pairings : null,
          why: w.why || null,
          awards: w.awards ? String(w.awards).split(';').map(s => s.trim()).filter(Boolean) : null,
          region: w.region || wineryRegion, "subRegion": w.subRegion || null,
          published: true, wineryId,
          created_by: who, created_at: now, updated_by: who, updated_at: now,
        };
        w.createdBy = who; w.createdAt = now; w.updatedBy = who; w.updatedAt = now;
        const { data } = await sb.from('wines').insert(row).select().single();
        if (data) w.id = data.id;
      }
    },
    async removeWine(id) {
      Store.wines = Store.wines.filter(x => x.id !== id);
      if (LIVE) await sb.from('wines').delete().eq('id', id);
    },
    // Upload a bottle photo to Supabase Storage and save its public URL on the
    // wine row. Returns the public URL. LIVE only (demo keeps localStorage).
    async uploadWineImage(id, file) {
      if (!LIVE) throw new Error('demo');
      const ext = (file.type && file.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
      const path = `${wineryId}/${id}.${ext}`;
      const up = await sb.storage.from('wine-images').upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' });
      if (up.error) throw new Error(up.error.message);
      const { data } = sb.storage.from('wine-images').getPublicUrl(path);
      const url = data.publicUrl + '?t=' + Date.now();   // cache-bust on replace
      await Store.updateWine(id, { image_url: url });
      const w = Store.wines.find(x => x.id === id); if (w) w.image = url;
      return url;
    },
    async removeWineImage(id) {
      const w = Store.wines.find(x => x.id === id);
      if (LIVE) { try { await sb.storage.from('wine-images').remove([`${wineryId}/${id}.jpg`, `${wineryId}/${id}.png`, `${wineryId}/${id}.webp`]); } catch (e) {} await Store.updateWine(id, { image_url: null }); }
      if (w) w.image = '';
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
          if (r.notes)   patch.notes   = r.notes;
          if (r.why)     patch.why     = r.why;
          await Store.updateWine(existing.id, patch);
          updated++;
        } else {
          await Store.addWine({
            id: 'tmp' + Date.now() + '-' + added, name,
            variety: r.variety, colour: r.colour, style: r.style, organic: !!r.organic,
            region: r.region, subRegion: r.subRegion, notes: r.notes, why: r.why || '',
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

  function normWine(r) { return { id: r.id, name: r.name, variety: r.variety, colour: r.colour, vintage: r.vintage, price: +r.price || 0, qty: +r.stock || +r.qty || 0, scans: +r.scans || 0, notes: r.notes || '', why: r.why || '', image: r.image_url || '', createdBy: r.created_by || '', createdAt: r.created_at || '', updatedBy: r.updated_by || '', updatedAt: r.updated_at || '' }; }
  function normOrder(r) {
    const items = (r.order_items || []).map(i => `${i.qty} × ${i.name}`).join(' · ');
    return { id: r.id, placedAt: rel(r.placedAt), destination: r.destination, items, total: +r.total || 0, status: r.status, gifts: r.gifts || null, method: r.method || 'deliver' };
  }
  function rel(ts) { if (!ts) return ''; const d = (Date.now() - new Date(ts)) / 86400000; return d < 1 ? 'today' : d < 2 ? 'yesterday' : Math.floor(d) + ' days ago'; }

  async function loadWinery() {
    const { data: maps, error } = await sb.from('winery_users').select('"wineryId"');
    if (error) { console.warn('winery_users lookup failed:', error.message); wineryId = null; wineries = []; return; }
    const ids = (maps || []).map(m => m.wineryId);
    if (!ids.length) { wineryId = null; wineries = []; return; }
    const { data: ws } = await sb.from('wineries').select('id,name,region,"ordersEmail","cellarDoorActive","growActive",fulfilment').in('id', ids).order('name');
    wineries = ws || ids.map(id => ({ id, name: 'Your winery', region: '' }));
    // Store-settings columns load separately + defensively: if the migration
    // (13-store-settings.sql) hasn't been run yet, this select errors and we
    // simply skip it rather than breaking winery loading.
    try {
      const { data: sset, error: sErr } = await sb.from('wineries')
        .select('id,free_threshold,min_order,mixed_cases,paused,paused_until,dozen_on,dozen_rate,alloc_on,alloc_cap,alloc_wines,local_pickup,gift_message,gift_wrap')
        .in('id', ids);
      if (!sErr && sset) sset.forEach(s => { const w = wineries.find(x => x.id === s.id); if (w) Object.assign(w, s); });
    } catch (e) { /* columns not present yet — settings stay at defaults */ }
    let pick = null;
    try { pick = localStorage.getItem(ACTIVE_KEY); } catch (e) {}
    const active = wineries.find(x => x.id === pick) || wineries[0];
    wineryId = active.id; wineryName = active.name; wineryRegion = active.region || '';
  }
  // Load supabase-js. Prefer our vendored copy (own origin); fall back to a
  // version-PINNED CDN (was the floating "@2" — a supply-chain risk) with
  // crossorigin. To vendor: put supabase.min.js in portal/vendor/ (see
  // vendor/DOWNLOAD.md).
  function loadLib() {
    return new Promise((res, rej) => {
      if (window.supabase) return res();
      const cdn = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
      const add = (src, onerr) => { const s = document.createElement('script'); s.src = src; s.crossOrigin = 'anonymous'; s.onload = () => res(); s.onerror = onerr; document.head.appendChild(s); };
      add('vendor/supabase.min.js', () => add(cdn, () => rej(new Error('Could not load Supabase'))));
    });
  }

  window.PStore = Store;
})();

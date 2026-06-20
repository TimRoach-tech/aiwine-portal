/* AIWine Winery Portal — demo app (vanilla JS).
   Demo winery: Ata Rangi, Martinborough. Works on sample data in the browser;
   swap to live Supabase (same database as the CRM) at deploy — see DEPLOY.md. */
(function () {
  'use strict';

  // ---------- icons ----------
  const I = {
    grid:'<path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>',
    bottle:'<path d="M9 2h6M10 2v4l-1 2v13a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V8l-1-2V2"/>',
    upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M12 3v13M7 8l5-5 5 5"/>',
    bag:'<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"/>',
    plug:'<path d="M9 2v6M15 2v6M6 8h12v3a6 6 0 0 1-12 0zM12 17v5"/>',
    scan:'<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10"/>',
    sparkle:'<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/>',
    heart:'<path d="M20.8 5.6a5 5 0 0 0-7 0L12 7.3l-1.8-1.7a5 5 0 0 0-7 7L12 21l8.8-8.4a5 5 0 0 0 0-7z"/>',
    map:'<path d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2zM9 3v16M15 5v16"/>',
    passport:'<path d="M4 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM9 7h6M12 11a2 2 0 1 0 0-.01zM8 18h8"/>',
    truck:'<path d="M1 3h15v13H1zM16 8h4l3 3v5h-7M5.5 19a2 2 0 1 0 0-.01M18.5 19a2 2 0 1 0 0-.01"/>',
    check:'<path d="M20 6 9 17l-5-5"/>',
    x:'<path d="M18 6 6 18M6 6l12 12"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
    leaf:'<path d="M11 20A7 7 0 0 1 4 13c0-6 7-10 16-10 0 9-4 16-9 17zM4 13c6-2 9-5 11-9"/>',
    menu:'<path d="M3 12h18M3 6h18M3 18h18"/>',
    book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    chart:'<path d="M3 3v18h18M7 16v-5M12 16V8M17 16v-9"/>',
  };
  const ic = (n,w,c)=>`<svg width="${w||18}" height="${w||18}" viewBox="0 0 24 24" fill="none" stroke="${c||'currentColor'}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${I[n]||''}</svg>`;
  const vine = (w,c)=>`<svg width="${w}" height="${w}" viewBox="0 0 100 100" fill="none" stroke="${c||'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 24c20-7 46-5 78-9"/><path d="M85 14c6-1 10 3 6 8s-9 1-7-4"/><path d="M47 17c-2 8 0 16-2 22"/><path d="M26 31c-9-4-13-15-5-21 1 6 7 7 10 3 5 7 2 20-5 19zM21 12c1 7 0 14-1 19"/><circle cx="41" cy="46" r="6"/><circle cx="54" cy="46" r="6"/><circle cx="34" cy="57" r="6"/><circle cx="47" cy="57" r="6"/><circle cx="60" cy="57" r="6"/><circle cx="40" cy="68" r="6"/><circle cx="53" cy="68" r="6"/><circle cx="47" cy="79" r="6"/></svg>`;

  // ---------- demo data ----------
  const TINT = { 'Pinot Noir':'#6B1F2A','Chardonnay':'#C9A45A','Sauvignon Blanc':'#93A35E','Rosé':'#D9889A','Syrah':'#2A0E18','Riesling':'#D7BE54','Pinot Gris':'#D9B58C' };
  let WINES = []; let ORDERS = [];   // filled from PStore at boot (demo or live)
  const FEED = [
    { ic:'scan', t:'<b>Crimson Pinot Noir</b> scanned at a restaurant in <b>Auckland</b>', when:'12m' },
    { ic:'sparkle', t:'The AI Sommelier recommended <b>Craighall Chardonnay</b> to 8 people today — "roast chicken" was the top ask', when:'1h' },
    { ic:'heart', t:'3 new wishlists on <b>Summer Rosé</b> — summer is coming', when:'3h' },
    { ic:'bag', t:'A mixed case including your <b>Te Wā Sauvignon</b> shipped to <b>Wellington</b>', when:'6h' },
    { ic:'passport', t:'<b>Sarah M.</b> stamped your cellar door in her Passport — her 2nd visit', when:'1d' },
    { ic:'scan', t:'<b>Kahu Riesling</b> scanned in <b>Christchurch</b> — out of stock, shown your Te Wā instead', when:'1d' },
  ];
  const REGIONS = [['Auckland',186],['Wellington',159],['Christchurch',88],['Waikato',41],['Otago',33],['Overseas',27]];
  const WEEK = [38,52,41,67,74,91,83];
  const ASKS = [['"with roast chicken"',31],['"like Ata Rangi but cheaper"',24],['"easy weeknight red"',19],['"a gift under $60"',14]];
  const SALES = { allTime:38940, month:4280, lastMonth:3650, bottles:1240, avg:268, months:[2900,3400,3100,3850,3650,4280], monthLabels:['Jan','Feb','Mar','Apr','May','Jun'] };
  const VARIETIES = Object.keys(TINT);

  // ---------- helpers ----------
  const $ = s => document.querySelector(s);
  const esc = s => String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const money = n => '$'+Number(n).toLocaleString('en-NZ');
  const toast = m => { const t=$('#toast'); t.textContent=m; t.classList.add('show'); clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),2200); };
  const bottleEl = w => `<span class="bottle" style="background:linear-gradient(160deg,${TINT[w.variety]||'#5C1B27'},#1B1410)"></span>`;
  const stockPill = s => `<span class="pill ${s}">${s==='in'?'In stock':s==='low'?'Low':'Out'}</span>`;
  const stkOf = w => w.qty<=0?'out':w.qty<=8?'low':'in';

  let route = 'dashboard';

  // ---------- nav ----------
  const NAV = [
    { sec:'Manage' },
    { id:'dashboard', label:'Dashboard', icon:'grid' },
    { id:'wines', label:'My Wines', icon:'bottle' },
    { id:'orders', label:'Orders', icon:'bag', badge:()=>ORDERS.filter(o=>o.status==='new').length },
    { id:'upload', label:'Upload list', icon:'upload' },
    { sec:'Grow' },
    { id:'insights', label:'Insights', icon:'chart' },
    { id:'integrations', label:'Integrations', icon:'plug' },
  ];

  function shell(){
    document.getElementById('app').innerHTML = `
      <aside class="side" id="side">
        <div class="side-top">
          <div class="wordmark">AI<span class="dot"></span>Wine<span class="sfx">Partner</span></div>
          <div class="winery-badge">
            <span class="av">${esc((PStore.wineryName||'A').charAt(0))}</span>
            <div style="min-width:0"><div class="nm">${esc(PStore.wineryName||'My Winery')}</div><div class="rg">${esc(PStore.wineryRegion||'')}</div></div>
          </div>
        </div>
        <nav class="nav" id="nav">
          ${NAV.map(n=> n.sec ? `<div class="nav-sec">${n.sec}</div>` :
            `<button class="nav-link" data-go="${n.id}">
              <span class="ic">${ic(n.icon,17)}</span>${n.label}
              ${n.badge?`<span class="badge" data-badge="${n.id}"></span>`:''}
            </button>`).join('')}
        </nav>
        <div class="side-foot">Demo data · <a href="../apps/winery/index.html" target="_blank">Open winery app ↗</a><br><span style="opacity:0.6">Live data connects at deploy</span></div>
      </aside>
      <div class="main">
        <div class="topbar">
          <div style="display:flex;align-items:center;gap:14px">
            <button class="btn-quiet menu-btn" id="menu">${ic('menu',20)}</button>
            <span class="demo">Demo · sample data</span>
          </div>
          <div class="actions">
            <button class="btn sm ghost" id="t-app">${ic('passport',15)} Winery app</button>
            <button class="btn sm primary" id="t-add">${ic('plus',15)} Add wine</button>
          </div>
        </div>
        <div class="content">
          <div id="screen-dashboard" class="screen"></div>
          <div id="screen-wines" class="screen"></div>
          <div id="screen-orders" class="screen"></div>
          <div id="screen-upload" class="screen"></div>
          <div id="screen-insights" class="screen"></div>
          <div id="screen-integrations" class="screen"></div>
        </div>
      </div>
      <div class="scrim" id="scrim"></div>
      <div class="modal" id="modal"></div>
      <div id="toast"></div>`;

    $('#nav').addEventListener('click', e=>{ const b=e.target.closest('[data-go]'); if(b) go(b.dataset.go); });
    $('#menu').addEventListener('click', ()=>$('#side').classList.toggle('open'));
    $('#t-add').addEventListener('click', addWineModal);
    $('#t-app').addEventListener('click', ()=>window.open('../apps/winery/index.html','_blank'));
    $('#scrim').addEventListener('click', closeModal);
    updateBadges();
  }

  function updateBadges(){
    document.querySelectorAll('[data-badge]').forEach(b=>{
      const n = NAV.find(x=>x.id===b.dataset.badge);
      const v = n&&n.badge?n.badge():0;
      b.textContent = v; b.style.display = v?'':'none';
    });
  }

  function go(id){
    route = id;
    document.querySelectorAll('.nav-link').forEach(l=>l.classList.toggle('on', l.dataset.go===id));
    document.querySelectorAll('.screen').forEach(s=>s.classList.remove('on'));
    const el = $('#screen-'+id); el.classList.add('on');
    RENDER[id](el);
    $('#side').classList.remove('open');
    $('.content').scrollTo?.(0,0); window.scrollTo(0,0);
  }

  // ---------- screens ----------
  const RENDER = {};

  RENDER.dashboard = el => {
    const lowOut = WINES.filter(w=>stkOf(w)==='low'||stkOf(w)==='out');
    const newOrders = ORDERS.filter(o=>o.status==='new');
    const totalScans = WINES.reduce((s,w)=>s+w.scans,0);
    const wkRev = ORDERS.reduce((s,o)=>s+(+o.total||0),0);
    const paid = ORDERS.filter(o=>o.status!=='cancelled');
    const totalSales = paid.reduce((s,o)=>s+(+o.total||0),0);
    const avgOrder = paid.length?Math.round(totalSales/paid.length):0;
    const shippedN = ORDERS.filter(o=>o.status==='shipped').length;
    const omax = Math.max(1,...paid.map(o=>+o.total||0));
    el.innerHTML = `
      <div class="page-head">
        <div><div class="eyebrow">Good morning</div><h1 class="page-title">Here's your <em>week</em>.</h1>
        <div class="sub-line">Everything customers are doing with your wines on AIWine.</div></div>
        <button class="btn primary" data-go="upload">${ic('upload',15)} Update my list</button>
      </div>
      ${lowOut.length?`<div class="alert ${lowOut.some(w=>stkOf(w)==='out')?'out':'warn'}">
        <span class="ai">${ic('bell',22,'var(--amber)')}</span>
        <div class="ab"><div class="at">${lowOut.length} wine${lowOut.length>1?'s':''} need${lowOut.length>1?'':'s'} attention</div>
        <div class="as">${lowOut.map(w=>w.name+' ('+(stkOf(w)==='out'?'out of stock':w.qty+' left')+')').join(' · ')}</div></div>
        <button class="btn sm" data-go="wines">Manage stock</button></div>`:''}
      <div class="grid stat-row" style="margin-bottom:20px">
        <div class="stat"><div class="k">New orders</div><div class="v">${newOrders.length}</div><div class="d up">${money(newOrders.reduce((s,o)=>s+o.total,0))} to fulfil</div></div>
        <div class="stat"><div class="k">Scans this week</div><div class="v">${totalScans}</div><div class="d up">↑ 18% vs last week</div></div>
        <div class="stat"><div class="k">Sommelier picks</div><div class="v">47</div><div class="d">times recommended</div></div>
        <div class="stat"><div class="k">Revenue · 30 days</div><div class="v" style="font-size:30px">${money(wkRev)}</div><div class="d">direct to you</div></div>
      </div>
      <div class="card card-pad" style="margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:24px">
          <div>
            <div class="label" style="margin-bottom:9px">Total sales · direct to you</div>
            <div style="font-family:var(--serif);font-size:46px;font-weight:500;line-height:1;letter-spacing:-0.01em">${money(totalSales)}</div>
            <div style="display:flex;gap:26px;margin-top:16px">
              <div><div class="mono" style="font-size:9.5px;letter-spacing:.1em;color:var(--muted)">ORDERS</div><div style="font-weight:700;font-size:18px;margin-top:3px">${paid.length}</div></div>
              <div><div class="mono" style="font-size:9.5px;letter-spacing:.1em;color:var(--muted)">SHIPPED</div><div style="font-weight:700;font-size:18px;margin-top:3px">${shippedN}</div></div>
              <div><div class="mono" style="font-size:9.5px;letter-spacing:.1em;color:var(--muted)">AVG ORDER</div><div style="font-weight:700;font-size:18px;margin-top:3px">${money(avgOrder)}</div></div>
            </div>
          </div>
          <div style="flex:1;min-width:230px;max-width:380px">
            <div class="label" style="margin-bottom:12px;text-align:right">Recent orders</div>
            ${paid.length?`<div class="spark" style="height:68px">${paid.slice(0,8).reverse().map(o=>`<div class="s" style="height:${Math.round((+o.total||0)/omax*100)}%"></div>`).join('')}</div>`:`<div style="height:68px;display:grid;place-items:center;color:var(--muted);font-size:12.5px;border:1px dashed var(--line);border-radius:8px;text-align:center;padding:0 12px">No sales yet — they'll appear here as orders come in.</div>`}
          </div>
        </div>
      </div>
      <div class="two">
        <div class="card">
          <div class="card-head"><span class="card-title">Live activity</span><span class="label">Real-time</span></div>
          <div class="card-pad" style="padding-top:4px;padding-bottom:6px">
            ${FEED.map(f=>`<div class="row-item"><span class="row-ic">${ic(f.ic,16)}</span><div class="row-bd"><div class="t">${f.t}</div><div class="when">${f.when} ago</div></div></div>`).join('')}
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:20px">
          <div class="card">
            <div class="card-head"><span class="card-title">New orders</span><button class="btn-quiet" data-go="orders" style="font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--brass)">View all</button></div>
            <div class="card-pad" style="padding-top:6px;padding-bottom:8px">
              ${newOrders.length?newOrders.map(o=>`<div class="row-item"><span class="row-ic">${ic('bag',15)}</span><div class="row-bd"><div class="t"><b>${o.items}</b></div><div class="when">${o.id} · ${o.destination} · ${money(o.total)}</div></div></div>`).join(''):'<div style="color:var(--muted);font-size:13px;padding:8px 0">No new orders right now.</div>'}
            </div>
          </div>
          <div class="card card-pad">
            <div class="label" style="margin-bottom:14px">Where your wine travels</div>
            ${REGIONS.slice(0,5).map(([r,v])=>`<div class="bar-row"><span class="bl">${r}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.round(v/186*100)}%"></div></div><span class="bv">${v}</span></div>`).join('')}
          </div>
        </div>
      </div>`;
    bindGo(el);
  };

  RENDER.wines = el => {
    el.innerHTML = `
      <div class="page-head">
        <div><div class="eyebrow">Your range</div><h1 class="page-title">My <em>wines</em>.</h1>
        <div class="sub-line">Change a price or stock level and it updates across AIWine in seconds.</div></div>
        <div style="display:flex;gap:10px"><button class="btn" data-go="upload">${ic('upload',15)} Bulk upload</button><button class="btn primary" id="add2">${ic('plus',15)} Add wine</button></div>
      </div>
      <div class="card">
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>Wine</th><th>Price (incl GST)</th><th>In cellar</th><th>Status</th><th class="r">Scans</th><th></th></tr></thead>
          <tbody id="wines-body">${WINES.map(wineRow).join('')}</tbody>
        </table></div>
      </div>
      <div style="margin-top:14px;font-size:12.5px;color:var(--muted)">${ic('check',13,'var(--green)')} Changes save instantly and sync to the consumer app, the shop and your cellar-door listing.</div>`;
    el.querySelector('#add2').addEventListener('click', addWineModal);
    bindWineRows(el); bindGo(el);
  };
  function wineRow(w){
    return `<tr data-wid="${w.id}">
      <td><div class="wine-cell">${bottleEl(w)}<div><div class="wine-nm">${esc(w.name)}</div><div class="wine-meta">${w.variety} · ${w.vintage}</div></div></div></td>
      <td><span class="price-edit"><span>$</span><input type="number" min="0" value="${w.price}" data-price></span></td>
      <td><span class="stepper"><button data-dec>−</button><input type="number" min="0" value="${w.qty}" data-qty><button data-inc>+</button></span></td>
      <td data-stock>${stockPill(stkOf(w))}</td>
      <td class="r mono" style="font-size:12px;color:var(--muted)">${w.scans}</td>
      <td class="r"><button class="btn-quiet" data-del title="Remove">${ic('x',16)}</button></td>
    </tr>`;
  }
  function bindWineRows(el){
    el.querySelectorAll('tr[data-wid]').forEach(tr=>{
      const id=+tr.dataset.wid; const w=WINES.find(x=>x.id===id);
      const refreshStock=()=>{ tr.querySelector('[data-stock]').innerHTML=stockPill(stkOf(w)); };
      tr.querySelector('[data-inc]').addEventListener('click',()=>{ w.qty++; PStore.updateWine(w.id,{qty:w.qty}); qa.value=w.qty; refreshStock(); toast('Stock updated · '+w.name); });
      tr.querySelector('[data-dec]').addEventListener('click',()=>{ if(w.qty>0)w.qty--; PStore.updateWine(w.id,{qty:w.qty}); qa.value=w.qty; refreshStock(); toast('Stock updated · '+w.name); });
      const qa=tr.querySelector('[data-qty]');
      qa.addEventListener('change',()=>{ w.qty=Math.max(0,+qa.value||0); PStore.updateWine(w.id,{qty:w.qty}); qa.value=w.qty; refreshStock(); toast('Stock updated · '+w.name); });
      const pa=tr.querySelector('[data-price]');
      pa.addEventListener('change',()=>{ w.price=Math.max(0,+pa.value||0); PStore.updateWine(w.id,{price:w.price}); pa.value=w.price; toast('Price updated · '+w.name); });
      tr.querySelector('[data-del]').addEventListener('click',()=>{ if(confirm('Remove '+w.name+' from your range?')){ PStore.removeWine(id); WINES=PStore.wines; go('wines'); toast('Removed'); } });
    });
  }

  RENDER.orders = el => {
    const seg = el._seg || 'open';
    const rows = ORDERS.filter(o=> seg==='open' ? o.status!=='shipped' : o.status==='shipped');
    el.innerHTML = `
      <div class="page-head">
        <div><div class="eyebrow">Fulfilment</div><h1 class="page-title"><em>Orders</em>.</h1>
        <div class="sub-line">Orders come straight from the customer to you — pack and ship from your cellar door.</div></div>
        <div class="seg"><button data-seg="open" class="${seg==='open'?'on':''}">To fulfil</button><button data-seg="shipped" class="${seg==='shipped'?'on':''}">Shipped</button></div>
      </div>
      <div class="card"><div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Order</th><th>Items</th><th>Destination</th><th class="r">Total</th><th>Status</th><th></th></tr></thead>
        <tbody>${rows.map(orderRow).join('')||`<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:30px">Nothing here.</td></tr>`}</tbody>
      </table></div></div>`;
    el.querySelectorAll('[data-seg]').forEach(b=>b.addEventListener('click',()=>{ el._seg=b.dataset.seg; RENDER.orders(el); }));
    el.querySelectorAll('[data-ship]').forEach(b=>b.addEventListener('click',()=>{ const o=ORDERS.find(x=>x.id===b.dataset.ship); PStore.updateOrder(o.id,{status:'shipped'}); updateBadges(); RENDER.orders(el); toast('Marked shipped · '+o.id); }));
    el.querySelectorAll('[data-pack]').forEach(b=>b.addEventListener('click',()=>{ const o=ORDERS.find(x=>x.id===b.dataset.pack); PStore.updateOrder(o.id,{status:'packing'}); RENDER.orders(el); toast('Moved to packing · '+o.id); }));
  };
  function orderRow(o){
    const pill = o.status==='new'?'<span class="pill new">New</span>':o.status==='packing'?'<span class="pill low">Packing</span>':'<span class="pill in">Shipped</span>';
    const act = o.status==='shipped'?'':o.status==='new'?`<button class="btn sm" data-pack="${o.id}">Start packing</button>`:`<button class="btn sm primary" data-ship="${o.id}">${ic('truck',14)} Mark shipped</button>`;
    return `<tr><td class="mono" style="font-size:12px">${o.id}<div class="wine-meta" style="margin-top:3px">${o.placedAt}</div></td><td style="font-size:13px;font-weight:600">${esc(o.items)}</td><td>${o.destination}</td><td class="r mono">${money(o.total)}</td><td>${pill}</td><td class="r">${act}</td></tr>`;
  }

  RENDER.upload = el => {
    el.innerHTML = `
      <div class="page-head"><div><div class="eyebrow">Bulk update</div><h1 class="page-title">Upload your <em>list</em>.</h1>
      <div class="sub-line">A spreadsheet of your range — we'll match it to your wines and you confirm before anything changes.</div></div></div>
      <div class="two">
        <div>
          <div class="drop" id="drop">
            <div class="dic">${ic('upload',26)}</div>
            <h3>Drop your CSV or Excel here</h3>
            <p>Or choose a file. We read columns like wine name, vintage, price and stock — in any order.</p>
            <button class="btn primary" id="pick">${ic('upload',15)} Choose a file</button>
            <input type="file" id="file" accept=".csv,.xlsx,.xls" hidden>
          </div>
          <div id="preview" style="margin-top:18px"></div>
        </div>
        <div class="card card-pad">
          <div class="label" style="margin-bottom:12px">Tips</div>
          <div style="display:flex;flex-direction:column;gap:13px;font-size:13px;color:var(--ink-soft);line-height:1.55">
            <div>${ic('check',14,'var(--green)')} One row per wine. A header row helps us map columns automatically.</div>
            <div>${ic('check',14,'var(--green)')} Update the <b>stock</b> column and we'll grey out anything that hits zero.</div>
            <div>${ic('check',14,'var(--green)')} Nothing changes until you review the preview and confirm.</div>
          </div>
          <button class="btn" id="tmpl" style="margin-top:18px;width:100%;justify-content:center">${ic('download',15)} Download a template</button>
        </div>
      </div>`;
    const drop=el.querySelector('#drop'), file=el.querySelector('#file');
    el.querySelector('#pick').addEventListener('click',()=>file.click());
    el.querySelector('#tmpl').addEventListener('click',()=>{ const csv='name,variety,vintage,price,stock\nCrimson Pinot Noir,Pinot Noir,2023,32,60\n'; const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='AIWine_range_template.csv'; a.click(); toast('Template downloaded'); });
    file.addEventListener('change',e=>{ if(e.target.files[0]) parseFile(e.target.files[0], el); });
    ['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('over');}));
    ['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('over');}));
    drop.addEventListener('drop',e=>{ const f=e.dataTransfer.files[0]; if(f) parseFile(f, el); });
  };
  function parseFile(f, el){
    const prev=el.querySelector('#preview');
    if(/\.(xlsx|xls)$/i.test(f.name)){
      prev.innerHTML = `<div class="card card-pad"><div class="label" style="margin-bottom:8px">${esc(f.name)}</div><div style="font-size:13px;color:var(--ink-soft)">Excel detected. In the live portal we read .xlsx directly; for this demo, export to <b>CSV</b> and drop it here to see the column-matching preview.</div></div>`;
      return;
    }
    const r=new FileReader();
    r.onload=()=>{
      const lines=String(r.result).split(/\r?\n/).filter(x=>x.trim());
      if(!lines.length){ prev.innerHTML='<div class="card card-pad" style="color:var(--muted)">Empty file.</div>'; return; }
      const cells=lines.map(l=>l.split(',').map(c=>c.trim().replace(/^"|"$/g,'')));
      const head=cells[0].map(h=>h.toLowerCase());
      const find=keys=>head.findIndex(h=>keys.some(k=>h.includes(k)));
      const ci={ name:find(['name','wine']), variety:find(['variet','grape','type']), vintage:find(['vintage','year']), price:find(['price','rrp','cost']), stock:find(['stock','qty','quantity','cellar']) };
      const body=cells.slice(1);
      const rows=body.map(c=>({ name:ci.name>=0?c[ci.name]:'', variety:ci.variety>=0?c[ci.variety]:'', vintage:ci.vintage>=0?c[ci.vintage]:'', price:ci.price>=0?c[ci.price]:'', stock:ci.stock>=0?c[ci.stock]:'' }));
      const matched=rows.filter(x=>WINES.some(w=>w.name.toLowerCase()===String(x.name).toLowerCase())).length;
      prev.innerHTML=`<div class="card">
        <div class="card-head"><span class="card-title">Preview · ${rows.length} rows</span><span class="label">${matched} match existing · ${rows.length-matched} new</span></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Wine</th><th>Variety</th><th>Vintage</th><th>Price</th><th>Stock</th><th></th></tr></thead>
        <tbody>${rows.slice(0,12).map(x=>{ const isNew=!WINES.some(w=>w.name.toLowerCase()===String(x.name).toLowerCase()); return `<tr><td style="font-weight:600">${esc(x.name)||'<span style="color:var(--red)">missing</span>'}</td><td>${esc(x.variety)}</td><td class="mono" style="font-size:12px">${esc(x.vintage)}</td><td class="mono" style="font-size:12px">${x.price?'$'+esc(x.price):''}</td><td class="mono" style="font-size:12px">${esc(x.stock)}</td><td>${isNew?'<span class="pill new">New</span>':'<span class="pill in">Update</span>'}</td></tr>`; }).join('')}</tbody></table></div>
        <div class="card-pad" style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--line-soft)">
          <span style="font-size:12.5px;color:var(--muted)">${rows.length>12?'+ '+(rows.length-12)+' more rows':'All rows shown'}</span>
          <button class="btn primary" id="confirm">${ic('check',15)} Confirm &amp; publish ${rows.length} wines</button>
        </div></div>`;
      prev.querySelector('#confirm').addEventListener('click',()=>{ toast('Published · '+rows.length+' wines synced to AIWine 🍷'); prev.innerHTML='<div class="card card-pad" style="text-align:center"><div style="color:var(--green);margin-bottom:6px">'+ic('check',26,'var(--green)')+'</div><div style="font-weight:700">Your range is live</div><div style="font-size:13px;color:var(--ink-soft);margin-top:4px">Customers see the changes now. (Demo — no data was written.)</div></div>'; });
    };
    r.readAsText(f);
  }

  RENDER.insights = el => {
    const max=Math.max(...WEEK);
    el.innerHTML=`
      <div class="page-head"><div><div class="eyebrow">Demand signals</div><h1 class="page-title"><em>Insights</em>.</h1>
      <div class="sub-line">What customers ask the Sommelier, and how it sends them to you.</div></div></div>
      <div class="two">
        <div class="card card-pad">
          <div class="label" style="margin-bottom:14px">Scans · last 7 days</div>
          <div class="spark">${WEEK.map(v=>`<div class="s" style="height:${Math.round(v/max*100)}%"></div>`).join('')}</div>
          <div style="display:flex;justify-content:space-between;margin-top:8px;font-family:var(--mono);font-size:9.5px;color:var(--faint);text-transform:uppercase">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>`<span>${d}</span>`).join('')}</div>
        </div>
        <div class="card card-pad">
          <div class="label" style="margin-bottom:14px">Top Sommelier asks that found you</div>
          ${ASKS.map(([q,v])=>`<div class="bar-row"><span class="bl" style="width:auto;flex:1">${q}</span><span class="bv">${v}</span></div>`).join('')}
        </div>
      </div>
      <div class="card card-pad" style="margin-top:20px">
        <div class="label" style="margin-bottom:14px">Most-scanned wines</div>
        ${[...WINES].sort((a,b)=>b.scans-a.scans).slice(0,5).map(w=>`<div class="bar-row"><span class="bl" style="width:200px;display:flex;align-items:center;gap:9px">${bottleEl(w)}${esc(w.name)}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.round(w.scans/214*100)}%"></div></div><span class="bv">${w.scans}</span></div>`).join('')}
      </div>`;
  };

  RENDER.integrations = el => {
    el.innerHTML=`
      <div class="page-head"><div><div class="eyebrow">Connect</div><h1 class="page-title"><em>Integrations</em>.</h1>
      <div class="sub-line">Three ways to keep your range in sync — pick what suits how you work.</div></div></div>
      <div class="int-grid">
        ${intCard('upload','CSV / Excel upload','Available now','in','Upload a spreadsheet whenever your range changes. We match columns automatically and you confirm before publishing.','Go to upload','upload')}
        ${intCard('grid','Live dashboard','Available now','in','Edit prices and stock directly here — every change syncs to AIWine in seconds. No spreadsheets needed.','Manage wines','wines')}
        ${intCard('plug','API / EPOS sync','Coming soon','low','Connect your till or online store (Shopify, Vend, Square) so stock keeps itself in sync — every sale, every restock, automatically.','Register interest',null,'mailto:partners@aiwine.co.nz?subject=API%20integration')}
      </div>
      <div class="card card-pad" style="margin-top:22px;display:flex;align-items:center;gap:18px;flex-wrap:wrap">
        <div style="flex:1;min-width:240px"><div class="card-title" style="margin-bottom:4px">The AIWine Winery app</div><div style="font-size:13px;color:var(--ink-soft);line-height:1.55">Manage stock and watch live scans from your phone — perfect for the cellar door. Same login, same data as this portal.</div></div>
        <button class="btn primary" id="open-app">${ic('passport',15)} Open the winery app</button>
      </div>`;
    el.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));
    el.querySelector('#open-app').addEventListener('click',()=>window.open('../apps/winery/index.html','_blank'));
  };
  function intCard(icon,title,status,pill,body,cta,goId,href){
    const action = href?`<a class="btn" href="${href}" style="justify-content:center">${cta} ↗</a>`:`<button class="btn ${goId==='wines'||goId==='upload'?'primary':''}" data-go="${goId}" style="justify-content:center">${cta}</button>`;
    return `<div class="card int"><div class="ii">${ic(icon,22)}</div>
      <div style="display:flex;align-items:center;gap:9px"><h3>${title}</h3><span class="pill ${pill}">${status}</span></div>
      <p>${body}</p>${action}</div>`;
  }

  function bindGo(el){ el.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go))); }

  // ---------- add wine modal ----------
  function addWineModal(){
    $('#modal').innerHTML=`
      <div class="modal-head"><h2>Add a wine</h2><button class="btn-quiet" id="m-x">${ic('x',18)}</button></div>
      <div class="modal-body">
        <div class="field"><label>Wine name</label><input id="f-name" placeholder="e.g. Crimson Pinot Noir" autofocus></div>
        <div class="grid-2">
          <div class="field"><label>Variety</label><select id="f-var">${VARIETIES.map(v=>`<option>${v}</option>`).join('')}</select></div>
          <div class="field"><label>Vintage</label><input id="f-vin" type="number" value="2024"></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Price (incl GST)</label><input id="f-price" type="number" placeholder="0"></div>
          <div class="field"><label>Bottles in cellar</label><input id="f-qty" type="number" value="0"></div>
        </div>
      </div>
      <div class="modal-foot"><button class="btn" id="m-cancel">Cancel</button><button class="btn primary" id="m-save">${ic('plus',15)} Add to my range</button></div>`;
    openModal();
    $('#m-x').onclick=closeModal; $('#m-cancel').onclick=closeModal;
    $('#m-save').onclick=()=>{
      const name=$('#f-name').value.trim(); if(!name){ toast('Give the wine a name'); return; }
      const w={ id:Date.now(), name, variety:$('#f-var').value, vintage:+$('#f-vin').value||2024, price:+$('#f-price').value||0, qty:+$('#f-qty').value||0, scans:0 };
      PStore.addWine(w); closeModal(); go('wines'); toast('Added · '+name+' is live on AIWine 🍷');
    };
  }
  function openModal(){ $('#scrim').classList.add('open'); $('#modal').classList.add('open'); }
  function closeModal(){ $('#scrim').classList.remove('open'); $('#modal').classList.remove('open'); }

  // ---------- login (live mode) ----------
  function renderLogin(err){
    document.getElementById('app').innerHTML = `
      <div style="grid-column:1/-1;min-height:100vh;display:grid;place-items:center;background:linear-gradient(180deg,#241B15,var(--ink))">
        <form id="lf" style="width:min(360px,90vw);background:var(--card);border:1px solid var(--line);border-radius:14px;padding:30px 28px;box-shadow:0 30px 80px rgba(0,0,0,.4)">
          <div class="wordmark" style="color:var(--ink);font-size:20px;margin-bottom:4px">AI<span class="dot" style="background:var(--claret)"></span>Wine<span class="sfx" style="color:var(--brass)">Partner</span></div>
          <div style="font-family:var(--serif);font-size:26px;font-weight:600;margin:10px 0 18px">Winery sign in</div>
          <div class="field" style="margin-bottom:12px"><label>Email</label><input id="le" type="email" autofocus></div>
          <div class="field" style="margin-bottom:14px"><label>Password</label><input id="lp" type="password"></div>
          ${err?`<div style="color:var(--red);font-size:12.5px;margin-bottom:12px">${esc(err)}</div>`:''}
          <button class="btn primary" type="submit" style="width:100%;justify-content:center">Sign in</button>
        </form>
        <div id="toast"></div>
      </div>`;
    document.getElementById('lf').addEventListener('submit', async e=>{
      e.preventDefault();
      try { await PStore.signIn(document.getElementById('le').value.trim(), document.getElementById('lp').value); boot(); }
      catch(ex){ renderLogin(ex.message); }
    });
  }

  // ---------- boot ----------
  async function boot(){
    let r; try { r = await PStore.init(); } catch(e){ r = { ok:false, error:e.message }; }
    if (r && r.needsAuth) { renderLogin(); return; }
    WINES = PStore.wines; ORDERS = PStore.orders;
    shell();
    go('dashboard');
    if (r && r.error) toast(r.error);
  }
  boot();
})();

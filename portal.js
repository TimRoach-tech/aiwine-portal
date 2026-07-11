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
    image:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 16l5-5 4 4 3-3 6 6"/><circle cx="8.5" cy="9.5" r="1.5"/>',
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

  // ---------- plans / activation (demo; Stripe + Supabase flag at go-live) ----------
  const PLAN_KEY='aiwine-portal:plan';
  let PLAN; try{ PLAN=JSON.parse(localStorage.getItem(PLAN_KEY))||{}; }catch(e){ PLAN={}; }
  PLAN=Object.assign({ cellarDoor:false, grow:false, story:'', hours:'', activatedVia:'' }, PLAN);
  function savePlan(){ try{ localStorage.setItem(PLAN_KEY, JSON.stringify(PLAN)); }catch(e){} }
  const CODES={ 'FOUNDING49':{price:49,label:'Founding'}, 'WAIRARAPA':{price:0,label:'Wairarapa Association'} };
  const hasCellar=()=> PStore.mode==='live' ? PStore.planCellarDoor : PLAN.cellarDoor;
  const hasGrow  =()=> PStore.mode==='live' ? PStore.planGrow : PLAN.grow;
  function activate(via, price){ PLAN.cellarDoor=true; PLAN.activatedVia=via; savePlan(); go('plan'); toast(price?('Virtual Cellar Door active \u00b7 $'+price+'/yr'):'Virtual Cellar Door active \u00b7 free'); }
  function demoCheckout(price, what){
    if(PStore.mode==='live'){
      const links=(window.PORTAL_CONFIG&&window.PORTAL_CONFIG.STRIPE_LINKS)||{};
      const link=what==='grow'?links.grow:links.cellarDoor;
      if(link){
        const url=link+(link.includes('?')?'&':'?')+'client_reference_id='+encodeURIComponent(PStore.wineryId||'');
        window.open(url,'_blank');
        toast('Card payment opens in a new tab — activates automatically on payment');
        return;
      }
      location.href='mailto:partners@aiwine.co.nz?subject='+encodeURIComponent((what==='grow'?'Grow package':'Virtual Cellar Door')+' — '+(PStore.wineryName||'winery'));
      toast('Card payment is being switched on — email us and we’ll activate you');
      return;
    }
    if(!confirm('Demo checkout \u2014 Stripe goes here at go-live.\n\n'+(what==='grow'?'Grow package':'Virtual Cellar Door')+' \u00b7 $'+price+'/yr.\n\nProceed (demo) to unlock?')) return;
    if(what==='grow'){ PLAN.grow=true; savePlan(); go('plan'); toast('Grow unlocked \u00b7 insights & integrations'); }
    else { activate('subscribed', price); }
  }
  function growLock(name){ return `<div class="page-head"><div><div class="eyebrow">Grow</div><h1 class="page-title"><em>${name}</em>.</h1></div></div><div class="card card-pad" style="text-align:center;padding:48px 24px"><div style="font-family:var(--serif);font-size:26px;margin-bottom:8px">${name} is part of <span style="color:var(--claret)">Grow</span></div><div style="font-size:13.5px;color:var(--ink-soft);max-width:440px;margin:0 auto 18px">Unlock scan insights, demand signals and API/EPOS integrations \u2014 $95/yr.</div><button class="btn primary" id="go-plan">See plans</button></div>`; }
  const VARIETIES = Object.keys(TINT);

  // ---------- helpers ----------
  const $ = s => document.querySelector(s);
  const esc = s => String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const money = n => '$'+Number(n).toLocaleString('en-NZ');
  const toast = m => { const t=$('#toast'); t.textContent=m; t.classList.add('show'); clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),2200); };
  const bottleEl = w => `<span class="bottle" style="background:linear-gradient(160deg,${TINT[w.variety]||'#5C1B27'},#1B1410)"></span>`;
  const stockPill = s => `<span class="pill ${s}">${s==='in'?'In stock':s==='low'?'Low':'Out'}</span>`;
  const stkOf = w => w.qty<=0?'out':w.qty<=8?'low':'in';
  const APP_URL = (window.PORTAL_CONFIG && window.PORTAL_CONFIG.WINERY_APP_URL) || '../apps/winery/index.html';

  let route = 'dashboard';

  // ---------- nav ----------
  const NAV = [
    { sec:'Manage' },
    { id:'dashboard', label:'Dashboard', icon:'grid' },
    { id:'wines', label:'My Wines', icon:'bottle' },
    { id:'orders', label:'Orders', icon:'bag', badge:()=>ORDERS.filter(o=>o.status==='new').length },
    { id:'upload', label:'Upload list', icon:'upload' },
    { id:'images', label:'Wine images', icon:'image' },
    { sec:'Grow' },
    { id:'plan', label:'Plans & Cellar Door', icon:'passport' },
    { id:'insights', label:'Insights', icon:'chart' },
    { id:'integrations', label:'Integrations', icon:'plug' },
    { id:'app', label:'Winery app', icon:'sparkle' },
  ];

  function shell(){
    const live = PStore.mode==='live';
    document.getElementById('app').innerHTML = `
      <aside class="side" id="side">
        <div class="side-top">
          <div class="wordmark">AI<span class="dot"></span>Wine<span class="sfx">Partner</span></div>
          ${(()=>{ const multi = live && PStore.wineries && PStore.wineries.length>1; return `
          <div class="winery-badge${multi?' switchable':''}" id="wb" ${multi?'role="button" tabindex="0" aria-label="Switch winery"':''}>
            <span class="av">${esc((PStore.wineryName||'A').charAt(0))}</span>
            <div style="min-width:0;flex:1">
              <div class="nm">${esc(PStore.wineryName||'My Winery')}</div>
              <div class="rg">${multi?esc(PStore.wineryRegion||'')+' · '+PStore.wineries.length+' wineries':esc(PStore.wineryRegion||'')}</div>
            </div>
            ${multi?'<span class="chev">▾</span>':''}
          </div>
          ${multi?`<div class="winery-menu" id="winery-menu">
            ${PStore.wineries.map(w=>`<button class="wm-item${w.id===PStore.wineryId?' on':''}" data-wid="${esc(w.id)}">
              <span class="mini">${esc((w.name||'A').charAt(0))}</span>
              <span class="wm-nm">${esc(w.name)}</span>
              ${w.id===PStore.wineryId?'<span class="tick">✓</span>':''}
            </button>`).join('')}
            <button class="wm-add" id="add-winery">+ Add another winery</button>
          </div>`:(live?`<a href="#" id="add-winery" style="display:block;font-size:11px;color:rgba(244,239,229,0.55);margin-top:8px;text-decoration:none">+ Add another winery</a>`:'')}`; })()}
        </div>
        <nav class="nav" id="nav">
          ${NAV.map(n=> n.sec ? `<div class="nav-sec">${n.sec}</div>` :
            `<button class="nav-link" data-go="${n.id}">
              <span class="ic">${ic(n.icon,17)}</span>${n.label}
              ${n.badge?`<span class="badge" data-badge="${n.id}"></span>`:''}
            </button>`).join('')}
        </nav>
        <div class="side-foot">${live?`AIWine Partner`:`Demo data · sample content`}</div>
      </aside>
      <div class="main">
        <div class="topbar">
          <div style="display:flex;align-items:center;gap:14px">
            <button class="btn-quiet menu-btn" id="menu">${ic('menu',20)}</button>
            <span class="demo">${live?esc((PStore.wineryRegion?PStore.wineryName+' · '+PStore.wineryRegion:PStore.wineryName)||'Live'):'Demo · sample data'}</span>
          </div>
          <div class="actions">
            ${live?`<span style="font-size:13px;color:var(--ink-soft)">${esc((PStore.userEmail&&PStore.userEmail.split('@')[0])||PStore.wineryName||'')}</span>
            <button class="btn sm ghost" id="signout">Sign out</button>`:''}
          </div>
        </div>
        <div class="content">
          <div id="screen-dashboard" class="screen"></div>
          <div id="screen-wines" class="screen"></div>
          <div id="screen-images" class="screen"></div>
          <div id="screen-cellar" class="screen"></div>
          <div id="screen-orders" class="screen"></div>
          <div id="screen-upload" class="screen"></div>
          <div id="screen-insights" class="screen"></div>
          <div id="screen-integrations" class="screen"></div>
          <div id="screen-plan" class="screen"></div>
          <div id="screen-app" class="screen"></div>
        </div>
      </div>
      <div class="scrim" id="scrim"></div>
      <div class="modal" id="modal"></div>
      <div id="toast"></div>`;

    $('#nav').addEventListener('click', e=>{ const b=e.target.closest('[data-go]'); if(b) go(b.dataset.go); });
    $('#menu').addEventListener('click', ()=>{ const s=$('#side'); s.classList.toggle('open'); $('#scrim').classList.toggle('open', s.classList.contains('open')||$('#modal').classList.contains('open')); });
    $('#scrim').addEventListener('click', ()=>{ closeModal(); $('#side').classList.remove('open'); $('#scrim').classList.remove('open'); });
    const so=$('#signout'); if(so) so.addEventListener('click', async e=>{ e.preventDefault(); await PStore.signOut(); renderLogin(); });
    const wb=$('#wb'), wm=$('#winery-menu');
    if(wb && wm){
      const togg=()=>{ wb.classList.toggle('open'); wm.classList.toggle('open'); };
      wb.addEventListener('click',togg);
      wb.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); togg(); } });
      wm.querySelectorAll('.wm-item').forEach(b=>b.addEventListener('click', async ()=>{
        if(b.dataset.wid===PStore.wineryId){ togg(); return; }
        b.style.opacity='0.6';
        await PStore.setActiveWinery(b.dataset.wid);
        WINES=PStore.wines; ORDERS=PStore.orders;
        shell(); go('dashboard'); toast('Now managing '+PStore.wineryName);
      }));
    }
    const aw=$('#add-winery'); if(aw) aw.addEventListener('click', e=>{ e.preventDefault(); addWineryModal(); });
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
    const el = $('#screen-'+id); if(!el){ console.warn('no screen for',id); return; } el.classList.add('on');
    if(RENDER[id]) RENDER[id](el);
    $('#side').classList.remove('open');
    if(!$('#modal').classList.contains('open')) $('#scrim').classList.remove('open');
    $('.content').scrollTo?.(0,0); window.scrollTo(0,0);
  }

  // ---------- screens ----------
  const RENDER = {};

  RENDER.dashboard = el => {
    const live = PStore.mode==='live';
    const lowOut = WINES.filter(w=>stkOf(w)==='low'||stkOf(w)==='out');
    const newOrders = ORDERS.filter(o=>o.status==='new');
    const totalScans = WINES.reduce((s,w)=>s+(+w.scans||0),0);
    const wkRev = ORDERS.reduce((s,o)=>s+(+o.total||0),0);
    const paid = ORDERS.filter(o=>o.status!=='cancelled');
    const totalSales = paid.reduce((s,o)=>s+(+o.total||0),0);
    const avgOrder = paid.length?Math.round(totalSales/paid.length):0;
    const shippedN = ORDERS.filter(o=>o.status==='shipped').length;
    const omax = Math.max(1,...paid.map(o=>+o.total||0));
    const firstRun = live && !WINES.length ? `
      <div class="card card-pad" style="margin-bottom:20px">
        <div class="card-title" style="margin-bottom:4px">Welcome to AIWine — let's get your range online</div>
        <div style="font-size:13px;color:var(--ink-soft);margin-bottom:14px">Three steps and your wines are in front of customers.</div>
        <div style="display:flex;flex-direction:column;gap:12px;font-size:13.5px">
          <div style="display:flex;align-items:center;gap:10px"><span class="pill new">1</span><div><b>Upload your wine list</b> — download our template, fill it in, drop it back. <a href="#" data-go="upload" style="color:var(--claret);font-weight:600">Start upload →</a></div></div>
          <div style="display:flex;align-items:center;gap:10px"><span class="pill new">2</span><div><b>Check prices &amp; stock</b> — fine-tune anything in My Wines. <a href="#" data-go="wines" style="color:var(--claret);font-weight:600">My wines →</a></div></div>
          <div style="display:flex;align-items:center;gap:10px"><span class="pill new">3</span><div><b>Put the winery app on your phone</b> — stock updates from the cellar door. <a href="${APP_URL}" target="_blank" style="color:var(--claret);font-weight:600">Open the app ↗</a></div></div>
          <div style="display:flex;align-items:center;gap:10px"><span class="pill new">4</span><div><b>Optional upgrades</b> — <b>Virtual Cellar Door</b> (your story, hours &amp; photos on AIWine) and <b>Grow</b> (scan insights &amp; EPOS/API integrations), <b>$95/yr each</b>, paid by card (Stripe) — activates immediately. Free uploads &amp; orders stay free forever. <a href="#" data-go="plan" style="color:var(--claret);font-weight:600">See plans →</a></div></div>
        </div>
      </div>` : '';
    el.innerHTML = `
      <div class="page-head">
        <div><div class="eyebrow">Good morning</div><h1 class="page-title">Here's your <em>week</em>.</h1>
        <div class="sub-line">Everything customers are doing with your wines on AIWine.</div></div>
        <button class="btn primary" data-go="upload">${ic('upload',15)} Update my list</button>
      </div>
      ${firstRun}
      ${lowOut.length?`<div class="alert ${lowOut.some(w=>stkOf(w)==='out')?'out':'warn'}">
        <span class="ai">${ic('bell',22,'var(--amber)')}</span>
        <div class="ab"><div class="at">${lowOut.length} wine${lowOut.length>1?'s':''} need${lowOut.length>1?'':'s'} attention</div>
        <div class="as">${lowOut.map(w=>w.name+' ('+(stkOf(w)==='out'?'out of stock':w.qty+' left')+')').join(' · ')}</div></div>
        <button class="btn sm" data-go="wines">Manage stock</button></div>`:''}
      <div class="grid stat-row" style="margin-bottom:20px">
        <div class="stat"><div class="k">New orders</div><div class="v">${newOrders.length}</div><div class="d up">${money(newOrders.reduce((s,o)=>s+o.total,0))} to fulfil</div></div>
        ${live?`<div class="stat"><div class="k">Wines live</div><div class="v">${WINES.length}</div><div class="d">on AIWine</div></div>
        <div class="stat"><div class="k">Label scans</div><div class="v">${totalScans}</div><div class="d">all time</div></div>`:`<div class="stat"><div class="k">Scans this week</div><div class="v">${totalScans}</div><div class="d up">↑ 18% vs last week</div></div>
        <div class="stat"><div class="k">Sommelier picks</div><div class="v">47</div><div class="d">times recommended</div></div>`}
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
            ${live?`<div style="color:var(--muted);font-size:13px;padding:18px 0;line-height:1.6">Activity appears here as customers scan and ask about your wines. It builds up once your range is live.</div>`:FEED.map(f=>`<div class="row-item"><span class="row-ic">${ic(f.ic,16)}</span><div class="row-bd"><div class="t">${f.t}</div><div class="when">${f.when} ago</div></div></div>`).join('')}
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
            ${live?`<div style="color:var(--muted);font-size:13px;padding:8px 0;line-height:1.6">Once orders and scans start, you'll see where in New Zealand (and beyond) your wines end up.</div>`:REGIONS.slice(0,5).map(([r,v])=>`<div class="bar-row"><span class="bl">${r}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.round(v/186*100)}%"></div></div><span class="bv">${v}</span></div>`).join('')}
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
        <div style="display:flex;gap:10px"><button class="btn" data-go="upload">${ic('upload',15)} Bulk upload</button><button class="btn primary" id="add2">${ic('plus',15)} Add bottle</button></div>
      </div>
      <div class="card">
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>Wine</th><th>Price (incl GST)</th><th>In cellar</th><th>Status</th><th class="r">Scans</th><th></th></tr></thead>
          <tbody id="wines-body">${WINES.map(wineRow).join('')}</tbody>
        </table></div>
      </div>
      <div style="margin-top:14px;font-size:12.5px;color:var(--muted)">${ic('check',13,'var(--green)')} Changes save instantly and sync to the consumer app, the shop and your cellar-door listing.</div>
      <div class="card card-pad" style="margin-top:18px" id="fulfil-card">
        <div style="display:flex;align-items:flex-start;gap:16px;flex-wrap:wrap">
          <div style="flex:1;min-width:260px">
            <div class="card-title" style="margin-bottom:4px">How you ship · fulfilment profile</div>
            <div style="font-size:12.5px;color:var(--ink-soft);line-height:1.55">This sets how the AIWine cart sells your wines. <b>Any quantity</b> — customers buy 1+ bottles ($12 delivery under 6, free on a Discovery Six). <b>Sixes &amp; twelves</b> — you pack full cartons only; the cart requires multiples of 6 and the AI suggests wines from your range to complete each carton.</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;min-width:210px" id="fulfil-opts">
            <label style="display:flex;align-items:center;gap:9px;font-size:13.5px;cursor:pointer"><input type="radio" name="fulfil" value="any"> Any quantity (1+ bottles)</label>
            <label style="display:flex;align-items:center;gap:9px;font-size:13.5px;cursor:pointer"><input type="radio" name="fulfil" value="cases"> Sixes &amp; twelves only</label>
          </div>
        </div>
      </div>`;
    el.querySelector('#add2').addEventListener('click', addWineModal);
    // fulfilment profile — writes to Supabase when live (portal → website/app),
    // localStorage in demo
    (function(){
      const FKEY='aiwine-portal:fulfilment';
      const live = PStore.mode==='live';
      let cur='any';
      if(live){ cur=PStore.fulfilment||'any'; }
      else { try{ cur=localStorage.getItem(FKEY)||'any'; }catch(e){} }
      el.querySelectorAll('input[name=fulfil]').forEach(r=>{
        r.checked = r.value===cur;
        r.addEventListener('change', async ()=>{
          if(live){
            try{ await PStore.setFulfilment(r.value); }
            catch(e){ toast('Could not save — try again'); r.checked=false; el.querySelector(`input[name=fulfil][value="${cur}"]`).checked=true; return; }
          } else { try{ localStorage.setItem(FKEY,r.value); }catch(e){} }
          cur=r.value;
          toast(r.value==='cases' ? 'Saved — your wines now sell in 6s & 12s on AIWine' : 'Saved — customers can buy any quantity'); });
      });
    })();
    bindWineRows(el); bindGo(el);
  };
  function wineRow(w){
    return `<tr data-wid="${w.id}">
      <td><div class="wine-cell">${bottleEl(w)}<div><div class="wine-nm">${esc(w.name)}</div><div class="wine-meta">${w.variety} · ${w.vintage}</div></div></div></td>
      <td><span class="price-edit"><span>$</span><input type="number" min="0" value="${w.price}" data-price></span></td>
      <td><span class="stepper"><button data-dec>−</button><input type="number" min="0" value="${w.qty}" data-qty><button data-inc>+</button></span></td>
      <td data-stock>${stockPill(stkOf(w))}</td>
      <td class="r mono" style="font-size:12px;color:var(--muted)">${w.scans||'—'}</td>
      <td class="r"><button class="btn-quiet" data-del title="Remove">${ic('x',16)}</button></td>
    </tr>`;
  }
  function bindWineRows(el){
    el.querySelectorAll('tr[data-wid]').forEach(tr=>{
      const id=tr.dataset.wid; const w=WINES.find(x=>String(x.id)===id);
      if(!w) return;
      const refreshStock=()=>{ tr.querySelector('[data-stock]').innerHTML=stockPill(stkOf(w)); };
      tr.querySelector('[data-inc]').addEventListener('click',()=>{ w.qty++; PStore.updateWine(w.id,{qty:w.qty}); qa.value=w.qty; refreshStock(); toast('Stock updated · '+w.name); });
      tr.querySelector('[data-dec]').addEventListener('click',()=>{ if(w.qty>0)w.qty--; PStore.updateWine(w.id,{qty:w.qty}); qa.value=w.qty; refreshStock(); toast('Stock updated · '+w.name); });
      const qa=tr.querySelector('[data-qty]');
      qa.addEventListener('change',()=>{ w.qty=Math.max(0,+qa.value||0); PStore.updateWine(w.id,{qty:w.qty}); qa.value=w.qty; refreshStock(); toast('Stock updated · '+w.name); });
      const pa=tr.querySelector('[data-price]');
      pa.addEventListener('change',()=>{ w.price=Math.max(0,+pa.value||0); PStore.updateWine(w.id,{price:w.price}); pa.value=w.price; toast('Price updated · '+w.name); });
      tr.querySelector('[data-del]').addEventListener('click',()=>{ if(confirm('Remove '+w.name+' from your range?')){ PStore.removeWine(w.id); WINES=PStore.wines; go('wines'); toast('Removed'); } });
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
      </table></div></div>
      ${PStore.mode==='live'?`
      <div class="card card-pad" style="margin-top:16px;display:flex;align-items:center;gap:16px;flex-wrap:wrap">
        <div style="flex:1;min-width:240px">
          <div class="card-title" style="font-size:16px;margin-bottom:3px">Order notifications${(PStore.wineries||[]).length>1?` \u00b7 ${esc(PStore.wineryName)}`:''}</div>
          <div style="font-size:12.5px;color:var(--ink-soft)">New orders for this winery are emailed here the moment they land. Each winery has its own address.</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <input id="oe-mail" type="email" value="${esc(PStore.ordersEmail||'')}" placeholder="orders@yourwinery.co.nz" style="width:240px;padding:9px 12px;border:1px solid var(--line);border-radius:8px;background:var(--card-2);font-size:13px">
          <button class="btn sm primary" id="oe-save">Save</button>
        </div>
      </div>`:''}`;
    const oe=el.querySelector('#oe-save');
    if(oe) oe.addEventListener('click', async ()=>{
      const v=el.querySelector('#oe-mail').value.trim();
      oe.disabled=true; oe.textContent='Saving…';
      try{ await PStore.setOrdersEmail(v); toast(v?'Order emails go to '+v:'Order email cleared'); }
      catch(e){ toast(e.message); }
      oe.disabled=false; oe.textContent='Save';
    });
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
      <div class="sub-line">The smoothest way is our ready-made template — it has every field (incl. tasting notes &amp; colour) with dropdowns, so your wines map first time. Download it, fill it in, drop it back.</div></div></div>
      <div class="two">
        <div>
          <div class="drop" id="drop">
            <div class="dic">${ic('upload',26)}</div>
            <h3>Drop your filled-in template here</h3>
            <p>CSV or Excel. Using our template means every column maps automatically and nothing is missed — no guesswork.</p>
            <button class="btn primary" id="pick">${ic('upload',15)} Choose a file</button>
            <input type="file" id="file" accept=".csv,.xlsx,.xls" hidden>
          </div>
          <div id="preview" style="margin-top:18px"></div>
        </div>
        <div class="card card-pad">
          <div class="label" style="margin-bottom:8px">Start here</div>
          <div style="font-size:13px;color:var(--ink-soft);line-height:1.55;margin-bottom:14px">Download our wine template first — it's the easiest, most reliable way to get your full range online, with built-in dropdowns and the right columns.</div>
          <button class="btn primary" id="tmpl" style="width:100%;justify-content:center;margin-bottom:18px">${ic('download',15)} Download the wine template</button>
          <div class="label" style="margin-bottom:12px">Good to know</div>
          <div style="display:flex;flex-direction:column;gap:13px;font-size:13px;color:var(--ink-soft);line-height:1.55">
            <div>${ic('check',14,'var(--green)')} Dropdowns keep variety, colour &amp; region spelt consistently.</div>
            <div>${ic('check',14,'var(--green)')} One row per wine — delete the grey example rows (they're skipped anyway).</div>
            <div>${ic('check',14,'var(--green)')} Tasting notes are kept to ~25 words so cards stay tidy.</div>
            <div>${ic('check',14,'var(--green)')} Nothing changes until you review the preview and confirm.</div>
          </div>
          <div style="font-size:11.5px;color:var(--muted);margin-top:14px">Own spreadsheet? We'll still try to match it — but the template is far more reliable.</div>
        </div>
      </div>`;
    const drop=el.querySelector('#drop'), file=el.querySelector('#file');
    el.querySelector('#pick').addEventListener('click',()=>file.click());
    el.querySelector('#tmpl').addEventListener('click',()=>{
      if(PStore.mode==='live'){ const a=document.createElement('a'); a.href='AIWine Wine Upload Template.xlsx'; a.download='AIWine Wine Upload Template.xlsx'; a.click(); toast('Template downloaded'); return; }
      const csv='name,variety,vintage,price,stock\nCrimson Pinot Noir,Pinot Noir,2023,32,60\n'; const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='AIWine_range_template.csv'; a.click(); toast('Template downloaded'); });
    file.addEventListener('change',e=>{ if(e.target.files[0]) parseFile(e.target.files[0], el); });
    ['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('over');}));
    ['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('over');}));
    drop.addEventListener('drop',e=>{ const f=e.dataTransfer.files[0]; if(f) parseFile(f, el); });
  };
  function parseFile(f, el){
    const prev=el.querySelector('#preview');
    const live = PStore.mode==='live';
    if(/\.(xlsx|xls)$/i.test(f.name)){
      if(!live){
        prev.innerHTML = `<div class="card card-pad"><div class="label" style="margin-bottom:8px">${esc(f.name)}</div><div style="font-size:13px;color:var(--ink-soft)">Excel detected. In the live portal we read .xlsx directly; for this demo, export to <b>CSV</b> and drop it here to see the column-matching preview.</div></div>`;
        return;
      }
      prev.innerHTML = `<div class="card card-pad" style="color:var(--ink-soft);font-size:13px">${ic('upload',15)} Reading ${esc(f.name)}…</div>`;
      loadXlsx().then(()=>{
        const r=new FileReader();
        r.onload=()=>{
          try{
            const wb = XLSX.read(new Uint8Array(r.result), { type:'array' });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const cells = XLSX.utils.sheet_to_json(sheet, { header:1, blankrows:false, defval:'' }).map(row=>row.map(c=>String(c==null?'':c)));
            handleCells(cells, el);
          }catch(e){ prev.innerHTML=`<div class="card card-pad" style="color:var(--red)">Couldn't read that Excel file (${esc(e.message)}). Try saving it as CSV and dropping it here.</div>`; }
        };
        r.readAsArrayBuffer(f);
      }).catch(()=>{ prev.innerHTML=`<div class="card card-pad" style="color:var(--red)">Couldn't load the Excel reader — check your connection, or export the file to CSV and drop it here.</div>`; });
      return;
    }
    const r=new FileReader();
    r.onload=()=>{
      const lines=String(r.result).split(/\r?\n/).filter(x=>x.trim());
      if(!lines.length){ prev.innerHTML='<div class="card card-pad" style="color:var(--muted)">Empty file.</div>'; return; }
      const cells=lines.map(l=>l.split(',').map(c=>c.trim().replace(/^"|"$/g,'')));
      handleCells(cells, el);
    };
    r.readAsText(f);
  }
  // lazy-load SheetJS for native .xlsx reading (live portal only)
  function loadXlsx(){
    return new Promise((res,rej)=>{
      if(window.XLSX) return res();
      const s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      s.onload=res; s.onerror=()=>rej(new Error('xlsx load failed'));
      document.head.appendChild(s);
    });
  }
  // shared: turn a raw cell matrix into normalised rows + render preview/confirm
  function handleCells(cells, el){
    const prev=el.querySelector('#preview');
    const live = PStore.mode==='live';
    if(!cells.length){ prev.innerHTML='<div class="card card-pad" style="color:var(--muted)">Empty file.</div>'; return; }
    const head=cells[0].map(h=>String(h||'').toLowerCase());
    const find=keys=>head.findIndex(h=>keys.some(k=>h.includes(k)));
    const ci={ name:find(['wine name','name','wine']), variety:find(['variet','grape']), colour:find(['colour','color','type']), vintage:find(['vintage','year']), price:find(['price','rrp','cost']), stock:find(['stock','qty','quantity','cellar']), notes:find(['tasting','notes','descrip']), pairings:find(['pairing','food','match']), style:find(['style','body']), organic:find(['organic']), awards:find(['award','medal']), region:find(['region']), sub:find(['sub-region','subregion','sub region']) };
    // canonical lists — snap dropdown fields to correct spelling/case on import
    const L_VAR=['Sparkling','Sauvignon Blanc','Riesling','Pinot Gris','Gewürztraminer','Albariño','Viognier','Chardonnay','Chenin Blanc','Semillon','White Blend','Rosé','Pinot Noir','Syrah','Merlot','Cabernet Sauvignon','Malbec','Tempranillo','Red Blend','Dessert','Fortified','Other'];
    const L_COL=['Red','White','Rosé','Sparkling','Dessert','Fortified'];
    const L_STY=['light','medium-bodied','full-bodied'];
    const L_REG=['Northland','Auckland','Waikato & Bay of Plenty','Gisborne','Hawke’s Bay','Wairarapa','Nelson','Marlborough','North Canterbury','Waitaki Valley','Central Otago','Other'];
    const snap=(v,list)=>{ if(!v)return ''; const t=String(v).trim().toLowerCase(); return list.find(x=>x.toLowerCase()===t)||String(v).trim(); };
    const at=(c,i)=>i>=0?String(c[i]||'').trim():'';
    const trim25=t=>{ t=String(t||'').trim(); const w=t.split(/\s+/).filter(Boolean); let s=w.length>25?w.slice(0,25).join(' '):t; if(s.length>160)s=s.slice(0,160).replace(/\s+\S*$/,''); return {text:s, cut:(w.length>25||t.length>160)}; };
    const isExample=n=>/^example\b/i.test(n)||/delete this row/i.test(n);
    let skipped=0, trimmedN=0;
    const rows=cells.slice(1).map(c=>{
      const name=at(c,ci.name);
      if(!name){ return null; }
      if(isExample(name)){ skipped++; return null; }
      const tn=trim25(at(c,ci.notes)); if(tn.cut)trimmedN++;
      const pair=at(c,ci.pairings).split(';').map(s=>s.trim()).filter(Boolean).slice(0,3);
      return { name, variety:snap(at(c,ci.variety),L_VAR), colour:snap(at(c,ci.colour),L_COL), vintage:at(c,ci.vintage), price:at(c,ci.price), stock:at(c,ci.stock), notes:tn.text, pairings:pair, style:snap(at(c,ci.style),L_STY), organic:/^y/i.test(at(c,ci.organic)), awards:at(c,ci.awards), region:snap(at(c,ci.region),L_REG), sub:at(c,ci.sub) };
    }).filter(Boolean);
    const matched=rows.filter(x=>WINES.some(w=>w.name.toLowerCase()===String(x.name).toLowerCase())).length;
    prev.innerHTML=`<div class="card">
      <div class="card-head"><span class="card-title">Preview · ${rows.length} wines</span><span class="label">${matched} update · ${rows.length-matched} new${skipped?' · '+skipped+' example skipped':''}</span></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Wine</th><th>Variety</th><th>Vintage</th><th>Price</th><th>Stock</th><th></th></tr></thead>
      <tbody>${rows.slice(0,12).map(x=>{ const isNew=!WINES.some(w=>w.name.toLowerCase()===String(x.name).toLowerCase()); return `<tr><td style="font-weight:600">${esc(x.name)||'<span style="color:var(--red)">missing</span>'}</td><td>${esc(x.variety)}</td><td class="mono" style="font-size:12px">${esc(x.vintage)}</td><td class="mono" style="font-size:12px">${x.price?'$'+esc(x.price):''}</td><td class="mono" style="font-size:12px">${esc(x.stock)}</td><td>${isNew?'<span class="pill new">New</span>':'<span class="pill in">Update</span>'}</td></tr>`; }).join('')}</tbody></table></div>
      <div class="card-pad" style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--line-soft)">
        <span style="font-size:12.5px;color:var(--muted)">${rows.length>12?'+ '+(rows.length-12)+' more':'All rows shown'}${trimmedN?' · '+trimmedN+' note'+(trimmedN>1?'s':'')+' shortened to 25 words':''}</span>
        <button class="btn primary" id="confirm">${ic('check',15)} Confirm &amp; publish ${rows.length} wines</button>
      </div></div>`;
    const done=(added,updated,note)=>{ prev.innerHTML='<div class="card card-pad" style="text-align:center"><div style="color:var(--green);margin-bottom:6px">'+ic('check',26,'var(--green)')+'</div><div style="font-weight:700">Your range is live</div><div style="font-size:13px;color:var(--ink-soft);margin-top:4px">'+(added+' new · '+updated+' updated. ')+note+'</div></div>'; };
    prev.querySelector('#confirm').addEventListener('click', async ()=>{
      const btn=prev.querySelector('#confirm');
      if(!live){ toast('Published · '+rows.length+' wines synced to AIWine 🍷'); done(rows.length-matched, matched, '(Demo — no data was written.)'); return; }
      btn.disabled=true; btn.textContent='Publishing…';
      try{
        const res=await PStore.bulkUpsert(rows);
        WINES=PStore.wines;
        toast('Published · '+res.total+' wines synced to AIWine 🍷');
        done(res.added, res.updated, 'Customers see the changes now.');
        updateBadges();
      }catch(e){ btn.disabled=false; btn.innerHTML=ic('check',15)+' Confirm &amp; publish '+rows.length+' wines'; toast('Upload failed: '+e.message); }
    });
  }

  RENDER.plan = el => {
    const active = hasCellar();
    const gate = `
      <div class="card card-pad">
        <div class="label" style="color:var(--brass);margin-bottom:8px">Virtual Cellar Door \u00b7 $95/yr</div>
        <div style="font-family:var(--serif);font-size:24px;margin-bottom:6px">Activate your virtual cellar door</div>
        <div style="font-size:13.5px;color:var(--ink-soft);max-width:560px;margin-bottom:18px">A rich profile \u2014 hero photo, your story, visit details and a \u201cCellar Door\u201d badge across AIWine. Self-managed, right here.</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">
          <button class="btn primary" data-pay="95">Subscribe \u00b7 $95/yr</button>
          <button class="btn" data-pay="49">Founding rate \u00b7 $49 first year</button>
        </div>
        <div style="display:flex;gap:8px;align-items:center;max-width:400px">
          <input id="code" placeholder="Have an activation code?" style="flex:1;padding:10px 12px;border:1px solid var(--line);border-radius:8px;background:var(--card-2);font-size:14px">
            <button class="btn" id="act-code">Apply</button>
        </div>
        <div style="font-size:12px;color:var(--muted);margin-top:12px">Pay by card — secure Stripe checkout, activates immediately. No invoices, cancel anytime. GST receipt emailed. <a href="#" id="plan-refresh" style="color:var(--claret)">Just paid? Check activation</a></div>
      </div>`;
    const editor = `
      <div class="card">
        <div class="card-head"><span class="card-title">Your cellar door</span><span class="pill in">Active \u00b7 ${esc(PLAN.activatedVia||'subscribed')}</span></div>
        <div class="card-pad" style="display:flex;flex-direction:column;gap:14px">
          <div class="field"><label>Your story</label><textarea id="cd-story" rows="4" style="width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:8px;background:var(--card-2);font-family:var(--sans);font-size:14px;resize:vertical" placeholder="Tell visitors who you are\u2026">${esc(PLAN.story||'')}</textarea></div>
          <div class="field"><label>Visit / tasting hours</label><input id="cd-hours" value="${esc(PLAN.hours||'')}" placeholder="Fri\u2013Sun \u00b7 11am\u20134pm" style="width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:8px;background:var(--card-2);font-size:14px"></div>
          <div class="field"><label>Hero photo</label><div style="border:2px dashed var(--line);border-radius:8px;padding:22px;text-align:center;color:var(--muted);font-size:13px">Drag a photo here (demo) \u2014 shown on your public profile</div></div>
          <div style="display:flex;justify-content:flex-end"><button class="btn primary" id="cd-save">Save \u2014 publish to my profile</button></div>
        </div>
      </div>`;
    el.innerHTML = `
      <div class="page-head"><div><div class="eyebrow">Your plan</div><h1 class="page-title">Plans &amp; <em>cellar door</em>.</h1>
      <div class="sub-line">Free portal &amp; wine uploads for everyone. Upgrade for a virtual cellar door and growth tools.</div></div></div>
      ${active ? editor : gate}
      <div class="card card-pad" style="margin-top:20px;display:flex;align-items:center;gap:18px;flex-wrap:wrap">
        <div style="flex:1;min-width:240px"><div class="card-title" style="margin-bottom:4px">See an example cellar door</div>
        <div style="font-size:13px;color:var(--ink-soft);line-height:1.55">How your Virtual Cellar Door looks on AIWine — story, visit details, wines and a “Cellar Door” badge. Example: <b>The Good Way</b>.</div></div>
        <a class="btn" href="#" data-go="cellar" style="justify-content:center">View example ↗</a>
      </div>
      <div class="card card-pad" style="margin-top:20px;display:flex;align-items:center;gap:18px;flex-wrap:wrap">
        <div style="flex:1;min-width:240px"><div class="card-title" style="margin-bottom:4px">Grow \u2014 insights &amp; integrations</div>
        <div style="font-size:13px;color:var(--ink-soft)">Scan insights, demand signals and API/EPOS sync. <b>$95/yr.</b></div></div>
        ${hasGrow()?'<span class="pill in">Active</span>':'<button class="btn primary" id="grow-buy">Unlock Grow \u00b7 $95/yr</button>'}
      </div>`;
    if(!active){
      el.querySelector('#act-code').addEventListener('click', async ()=>{
        const c=(el.querySelector('#code').value||'').trim().toUpperCase();
        if(!c) return;
        if(PStore.mode==='live'){
          const b=el.querySelector('#act-code'); b.disabled=true; b.textContent='Checking…';
          try{ const f=await PStore.redeemCode(c); toast(f==='grow'?'Grow unlocked':'Virtual Cellar Door active'); go('plan'); }
          catch(e){ toast(e.message); b.disabled=false; b.textContent='Apply'; }
          return;
        }
        const hit=CODES[c]; if(!hit){ toast('That code isn\u2019t valid'); return; } activate(hit.label, hit.price);
      });
      el.querySelectorAll('[data-pay]').forEach(b=>b.addEventListener('click',()=>demoCheckout(+b.dataset.pay)));
      const pr=el.querySelector('#plan-refresh');
      if(pr) pr.addEventListener('click', async e=>{ e.preventDefault(); if(PStore.mode!=='live') return; await PStore.refreshPlan(); go('plan'); toast(hasCellar()||hasGrow()?'Activated — welcome aboard':'Not active yet — payments can take a minute'); });
    } else {
      el.querySelector('#cd-save').addEventListener('click',()=>{ PLAN.story=el.querySelector('#cd-story').value; PLAN.hours=el.querySelector('#cd-hours').value; savePlan(); toast('Cellar door updated \u00b7 live on your profile'); });
    }
    const gb=el.querySelector('#grow-buy'); if(gb) gb.addEventListener('click',()=>demoCheckout(95,'grow'));
    bindGo(el);
  };

  RENDER.cellar = el => {
    el.innerHTML = `
      <div class="page-head"><div><div class="eyebrow">Example · Virtual Cellar Door</div><h1 class="page-title">The <em>Good Way</em>.</h1>
      <div class="sub-line">A preview of how your Virtual Cellar Door looks to customers on AIWine.</div></div>
      <button class="btn" data-go="plan">${ic('x',15)} Close</button></div>
      <div class="card" style="overflow:hidden">
        <div style="background:linear-gradient(150deg,#3A0E18,#5C1B27 62%,#431019);color:#F4EFE5;padding:34px 30px;position:relative">
          <span style="display:inline-flex;align-items:center;gap:7px;font-family:var(--mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;background:rgba(201,168,120,.22);border:1px solid rgba(201,168,120,.5);color:#E7CD9A;border-radius:999px;padding:5px 12px">${ic('sparkle',12)} Cellar Door</span>
          <div style="font-family:var(--serif);font-size:34px;font-weight:600;margin:14px 0 4px">The Good Way</div>
          <div style="font-size:13.5px;opacity:.86">Martinborough · Wairarapa</div>
        </div>
        <div class="card-pad">
          <div style="font-size:14.5px;line-height:1.65;color:var(--ink-soft);max-width:60ch">A small family estate on the Martinborough terrace, farming organically since 2004. We make single-vineyard Pinot Noir and aromatic whites the honest way — hand-picked, wild-fermented, and never rushed. Drop in for a tasting and a wander through the vines.</div>
          <div class="grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin-top:22px">
            <div><div class="label" style="margin-bottom:4px">Open</div><div style="font-size:13.5px">Fri–Sun · 11am–5pm</div></div>
            <div><div class="label" style="margin-bottom:4px">Tastings</div><div style="font-size:13.5px">$15pp · waived on purchase</div></div>
            <div><div class="label" style="margin-bottom:4px">Find us</div><div style="font-size:13.5px">42 Puruatanga Rd, Martinborough</div></div>
            <div><div class="label" style="margin-bottom:4px">Book</div><div style="font-size:13.5px">hello@thegoodway.co.nz</div></div>
          </div>
        </div>
        <div class="card-pad" style="border-top:1px solid var(--line-soft)">
          <div class="label" style="margin-bottom:14px">Our wines</div>
          <div class="grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px">
            ${(WINES.length?WINES.slice(0,6):[{name:'Terrace Pinot Noir',variety:'Pinot Noir',vintage:'2022',price:52},{name:'Wild Ferment Chardonnay',variety:'Chardonnay',vintage:'2023',price:38},{name:'Dry Riesling',variety:'Riesling',vintage:'2023',price:30}]).map(w=>`
              <div style="border:1px solid var(--line-soft);border-radius:12px;padding:14px;display:flex;gap:12px;align-items:center">
                <div style="width:30px;height:46px;border-radius:5px;flex:none;background:${TINT[w.variety]||'#6B1F2A'}"></div>
                <div><div style="font-weight:600;font-size:13.5px;line-height:1.2">${esc(w.name)}</div>
                <div style="font-size:11.5px;color:var(--muted);margin-top:2px">${w.variety} · ${w.vintage}</div>
                <div style="font-size:13px;color:var(--claret);font-weight:600;margin-top:3px">$${(+w.price||0).toFixed(0)}</div></div>
              </div>`).join('')}
          </div>
        </div>
      </div>
      <div style="font-size:12px;color:var(--muted);margin-top:14px;text-align:center">This is a demo preview. Activate the Virtual Cellar Door to publish yours on AIWine.</div>`;
    bindGo(el);
  };

  RENDER.app = el => {
    el.innerHTML = `
      <div class="page-head"><div><div class="eyebrow">In your pocket</div><h1 class="page-title">Winery <em>app</em>.</h1>
      <div class="sub-line">Manage stock and watch live scans from your phone — same login, same data.</div></div></div>
      <div class="card card-pad" style="display:flex;align-items:center;gap:18px;flex-wrap:wrap">
        <div style="flex:1;min-width:240px"><div class="card-title" style="margin-bottom:4px">Get the AIWine Winery app</div>
        <div style="font-size:13px;color:var(--ink-soft);line-height:1.55">Live scans, quick stock edits from the cellar door, and orders on the go. It installs straight to your home screen — no app store needed.</div></div>
        <button class="btn primary" id="app-open">${ic('sparkle',15)} Download the winery app</button>
      </div>
      <div class="card card-pad" style="margin-top:16px">
        <div class="label" style="margin-bottom:10px">How to install</div>
        <div style="font-size:13.5px;color:var(--ink-soft);line-height:1.7"><b>1.</b> Tap <b>Download the winery app</b> above (open it on your phone).<br><b>2.</b> Choose <b>Add to Home Screen</b> — iPhone: Share then “Add to Home Screen”. Android: menu ⋮ then “Install app”.<br><b>3.</b> Open it from your home screen and sign in with your portal login.</div>
      </div>`;
    const o=el.querySelector('#app-open'); if(o) o.addEventListener('click',()=>window.open(APP_URL,'_blank'));
  };

  RENDER.insights = el => {
    const scope = el._scope || 'local';
    const live = PStore.mode==='live';
    const totalScans = WINES.reduce((s,w)=>s+(+w.scans||0),0);
    const max=Math.max(...WEEK);
    const tabs = `<div class="seg">${[['local','Your winery'],['regional','Wairarapa region'],['national','New Zealand']].map(([k,l])=>`<button data-scope="${k}" class="${scope===k?'on':''}">${l}</button>`).join('')}</div>`;
    const local = `
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
    function aggCard(title, rows, note){ const mx=rows[0][1]; return `
      <div class="card card-pad"><div class="label" style="margin-bottom:14px">${title}</div>
      ${rows.map(([n,v])=>`<div class="bar-row"><span class="bl" style="width:160px">${n}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.round(v/mx*100)}%"></div></div><span class="bv">${v}%</span></div>`).join('')}
      <div style="font-size:11.5px;color:var(--muted);margin-top:12px">${note}</div></div>`; }
    const locked = (label,desc)=>`<div class="card card-pad" style="text-align:center;padding:48px 24px"><div style="font-family:var(--serif);font-size:26px;margin-bottom:8px">${label} insights are part of <span style="color:var(--claret)">Grow</span></div><div style="font-size:13.5px;color:var(--ink-soft);max-width:470px;margin:0 auto 18px">Your own data is always free. A Grow subscription ($95/yr) adds ${desc} — aggregated across wineries and anonymised.</div><button class="btn primary" id="go-plan">See plans</button></div>`;
    let body;
    if(live){
      if(scope==='local'){
        body = totalScans ? `
          <div class="card card-pad">
            <div class="label" style="margin-bottom:14px">Most-scanned wines</div>
            ${[...WINES].sort((a,b)=>(b.scans||0)-(a.scans||0)).slice(0,5).map(w=>`<div class="bar-row"><span class="bl" style="width:200px;display:flex;align-items:center;gap:9px">${bottleEl(w)}${esc(w.name)}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.round((w.scans||0)/Math.max(1,WINES.reduce((m,x)=>Math.max(m,+x.scans||0),0))*100)}%"></div></div><span class="bv">${w.scans||0}</span></div>`).join('')}
          </div>` : `
          <div class="card card-pad" style="text-align:center;padding:48px 24px">
            <div style="font-family:var(--serif);font-size:24px;margin-bottom:8px">Your insights start with your first scan</div>
            <div style="font-size:13.5px;color:var(--ink-soft);max-width:460px;margin:0 auto">Once customers start scanning your labels and asking the Sommelier about your wines, this page fills with real demand signals — scans per day, the questions that found you, and your most-scanned wines.</div>
          </div>`;
      } else {
        body = `<div class="card card-pad" style="text-align:center;padding:48px 24px">
          <div style="font-family:var(--serif);font-size:24px;margin-bottom:8px">${scope==='regional'?'Regional':'National'} insights are coming</div>
          <div style="font-size:13.5px;color:var(--ink-soft);max-width:470px;margin:0 auto 18px">Aggregated, anonymised demand signals across ${scope==='regional'?'your region':'New Zealand'} unlock as more wineries join AIWine. We'll email you when they're ready.</div>
          <a class="btn" href="mailto:partners@aiwine.co.nz?subject=Insights%20interest" style="justify-content:center">Register interest ↗</a>
        </div>`;
      }
    }
    else if(scope==='local') body=local;
    else if(!hasGrow()) body=locked(scope==='regional'?'Regional':'National', scope==='regional'?'how your whole region is trending':'the national picture');
    else if(scope==='regional') body=`<div class="two">${aggCard('Most-asked varieties · Wairarapa', [['Pinot Noir',38],['Chardonnay',22],['Sauvignon Blanc',16],['Syrah',12],['Rosé',8]], 'Aggregated across 40+ Wairarapa wineries on AIWine. Anonymised.')}${aggCard('Demand vs last quarter', [['Pinot Noir',12],['Rosé',9],['Chardonnay',5],['Syrah',3],['Sauvignon Blanc',2]], 'Change in Sommelier asks across the region.')}</div>`;
    else body=`<div class="two">${aggCard('Most-asked varieties · New Zealand', [['Sauvignon Blanc',41],['Pinot Noir',24],['Chardonnay',14],['Pinot Gris',9],['Rosé',7]], 'Aggregated across every region on AIWine. Anonymised.')}${aggCard('Rising nationally · last 90 days', [['Albariño',31],['Chenin Blanc',22],['Syrah',14],['Rosé',11],['Pinot Gris',6]], 'Fastest-growing Sommelier asks, nationwide.')}</div>`;
    el.innerHTML = `<div class="page-head"><div><div class="eyebrow">Demand signals</div><h1 class="page-title"><em>Insights</em>.</h1><div class="sub-line">Your own data is free. Grow adds the regional &amp; national picture.</div></div>${tabs}</div>${body}`;
    el.querySelectorAll('[data-scope]').forEach(b=>b.addEventListener('click',()=>{ el._scope=b.dataset.scope; RENDER.insights(el); }));
    const gp=el.querySelector('#go-plan'); if(gp) gp.addEventListener('click',()=>go('plan'));
  };

  RENDER.integrations = el => {
    const partners = [
      ['Shopify','E-commerce','Sync products, stock and sales from your Shopify store.'],
      ['WooCommerce','E-commerce','WordPress / WooCommerce product and stock sync.'],
      ['Squarespace','E-commerce','Keep your Squarespace shop and AIWine in step.'],
      ['Vend by Lightspeed','EPOS','Cellar-door till sales keep your AIWine stock current.'],
      ['Square','EPOS','Square POS sales adjust your live stock automatically.'],
      ['Lightspeed Retail','EPOS','Retail point-of-sale inventory sync.'],
      ['EPOS Now','EPOS','Point-of-sale stock kept in sync in real time.'],
      ['Xero','Accounting','Push orders and invoices straight into Xero.'],
      ['Cin7 Core','Inventory','Warehouse and 3PL stock levels flow through.'],
    ];
    el.innerHTML=`
      <div class="page-head"><div><div class="eyebrow">Connect</div><h1 class="page-title"><em>Integrations</em>.</h1>
      <div class="sub-line">Keep your range in sync — from a simple spreadsheet today to full till &amp; store automation.</div></div></div>
      <div class="label" style="margin:4px 0 12px">Available now</div>
      <div class="int-grid">
        ${intCard('upload','CSV / Excel upload','Available now','in','Upload a spreadsheet whenever your range changes. We match columns automatically and you confirm before publishing.','Go to upload','upload')}
        ${intCard('grid','Live dashboard','Available now','in','Edit prices and stock directly here — every change syncs to AIWine in seconds. No spreadsheets needed.','Manage wines','wines')}
        ${intCard('bottle','Wine images','Available now','in','Drag in your bottle photos — each lands on the right wine by file name.','Add photos','images')}
      </div>
      <div class="label" style="margin:26px 0 12px">Point-of-sale, e-commerce &amp; accounting <span style="color:var(--muted);font-weight:400">· coming soon</span></div>
      <div class="int-grid">
        ${intCard('plug','Open API &amp; webhooks','Coming soon','low','A REST API and webhooks to push stock and pull scan data programmatically.','Register interest',null,'mailto:partners@aiwine.co.nz?subject=Open%20API')}
        ${partners.map(p=>intCard('plug',p[0],'Coming soon','low',p[1]+' — '+p[2],'Register interest',null,'mailto:partners@aiwine.co.nz?subject='+encodeURIComponent(p[0]+' integration'))).join('')}
      </div>
      <div class="card card-pad" style="margin-top:22px;display:flex;align-items:center;gap:18px;flex-wrap:wrap">
        <div style="flex:1;min-width:240px"><div class="card-title" style="margin-bottom:4px">The AIWine Winery app</div><div style="font-size:13px;color:var(--ink-soft);line-height:1.55">Manage stock and watch live scans from your phone — perfect for the cellar door. Same login, same data as this portal.</div></div>
        <button class="btn primary" id="open-app">${ic('sparkle',15)} Get the winery app</button>
      </div>`;
    el.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));
    el.querySelector('#open-app').addEventListener('click',()=>window.open(APP_URL,'_blank'));
  };
  function intCard(icon,title,status,pill,body,cta,goId,href){
    const action = href?`<a class="btn" href="${href}" style="justify-content:center">${cta} ↗</a>`:`<button class="btn ${goId==='wines'||goId==='upload'?'primary':''}" data-go="${goId}" style="justify-content:center">${cta}</button>`;
    return `<div class="card int"><div class="ii">${ic(icon,22)}</div>
      <div style="display:flex;align-items:center;gap:9px"><h3>${title}</h3><span class="pill ${pill}">${status}</span></div>
      <p>${body}</p>${action}</div>`;
  }

  function bindGo(el){ el.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go))); }

  // ---------- wine images (bottle photos) ----------
  RENDER.images = el => {
    const KEY='aiwine-portal:wine-images';
    let imgs; try{ imgs=JSON.parse(localStorage.getItem(KEY))||{}; }catch(e){ imgs={}; }
    const save=()=>{ try{ localStorage.setItem(KEY,JSON.stringify(imgs)); }catch(e){} };
    const slug=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    const toDataURL=(f,cb)=>{ const r=new FileReader(); r.onload=()=>cb(r.result); r.readAsDataURL(f); };
    let target=null;
    const single=document.createElement('input'); single.type='file'; single.accept='image/*';
    single.addEventListener('change',e=>{ const f=e.target.files[0]; if(f&&target){ toDataURL(f,d=>{ imgs[target]=d; save(); draw(); toast('Photo added'); }); } single.value=''; target=null; });
    function handleFiles(files){
      const arr=[...files].filter(f=>/^image\//.test(f.type)); let pending=arr.length; if(!pending) return; let matched=0, un=0;
      arr.forEach(f=>{ const base=slug(f.name.replace(/\.[^.]+$/,''));
        const w=WINES.find(x=>{ const s1=slug(x.name+'-'+(x.vintage||'')); const s2=slug(x.name); return base===s1||base===s2||(s2&&base.indexOf(s2)>=0); });
        toDataURL(f,d=>{ if(w){ imgs[w.id]=d; matched++; } else un++; if(--pending===0){ save(); draw(); toast(matched+' matched'+(un?' · '+un+' unmatched':'')); } }); });
    }
    function draw(){
      el.innerHTML = `
        <div class="page-head"><div><div class="eyebrow">Bottle photos</div><h1 class="page-title">Wine <em>images</em>.</h1>
        <div class="sub-line">One bottle photo per wine. Drag them all in at once — we match each photo to a wine by its file name.</div></div>
        <div style="display:flex;gap:10px"><button class="btn primary" id="pickall">${ic('upload',15)} Add photos</button></div></div>
        <div class="drop" id="drop"><div class="dic">${ic('image',26)}</div><h3>Drop bottle photos here</h3><p>JPG or PNG. Name each file like the wine + vintage, e.g. <b>crimson-pinot-noir-2023.jpg</b> — it lands on the right wine automatically.</p><input type="file" id="fileall" accept="image/*" multiple hidden></div>
        <div class="card" style="margin-top:18px"><div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>Photo</th><th>Wine</th><th>File name to use</th><th></th></tr></thead>
          <tbody>${WINES.map(w=>{ const src=imgs[w.id]; const fn=slug(w.name+'-'+(w.vintage||''))+'.jpg';
            return `<tr><td><div style="width:38px;height:48px;border-radius:6px;overflow:hidden;background:var(--card-2);display:flex;align-items:center;justify-content:center;color:var(--muted)">${src?`<img src="${src}" style="width:100%;height:100%;object-fit:cover" alt="">`:ic('image',16)}</div></td>
            <td><div class="wine-nm">${esc(w.name)}</div><div class="wine-meta">${w.variety} · ${w.vintage}</div></td>
            <td class="mono" style="font-size:12px;color:var(--muted)">${fn}</td>
            <td style="display:flex;gap:6px;align-items:center"><button class="btn sm" data-up="${w.id}">${src?'Replace':'Upload'}</button>${src?`<button class="btn-quiet" data-rm="${w.id}" title="Remove">${ic('x',15)}</button>`:''}</td></tr>`;
          }).join('')}</tbody></table></div></div>`;
      el.querySelectorAll('[data-up]').forEach(b=>b.addEventListener('click',()=>{ target=b.dataset.up; single.click(); }));
      el.querySelectorAll('[data-rm]').forEach(b=>b.addEventListener('click',()=>{ delete imgs[b.dataset.rm]; save(); draw(); }));
      const fa=el.querySelector('#fileall');
      el.querySelector('#pickall').addEventListener('click',()=>fa.click());
      fa.addEventListener('change',e=>handleFiles(e.target.files));
      const drop=el.querySelector('#drop');
      ['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('over');}));
      ['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('over');}));
      drop.addEventListener('drop',e=>{ e.preventDefault(); handleFiles(e.dataTransfer.files); });
    }
    draw();
  };

  // ---------- add wine modal ----------
  function addWineModal(){
    $('#modal').innerHTML=`
      <div class="modal-head"><h2>Add a bottle</h2><button class="btn-quiet" id="m-x">${ic('x',18)}</button></div>
      <div class="modal-body">
        <div class="field"><label>Wine name</label><input id="f-name" placeholder="e.g. Crimson Pinot Noir" autofocus></div>
        <div class="grid-2">
          <div class="field"><label>Variety</label><select id="f-var">${VARIETIES.map(v=>`<option>${v}</option>`).join('')}<option>Other</option></select></div>
          <div class="field"><label>Colour / type</label><select id="f-colour"><option>Red</option><option>White</option><option>Rosé</option><option>Sparkling</option><option>Dessert</option><option>Fortified</option></select></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Vintage</label><input id="f-vin" type="number" value="2024"></div>
          <div class="field"><label>Price (incl GST)</label><input id="f-price" type="number" placeholder="0"></div>
        </div>
        <div class="field"><label>Bottles in cellar</label><input id="f-qty" type="number" value="0"></div>
        <div class="grid-2">
          <div class="field"><label>Style</label><select id="f-style"><option value="">—</option><option>light</option><option>medium-bodied</option><option>full-bodied</option></select></div>
          <div class="field"><label>Organic</label><select id="f-organic"><option>N</option><option>Y</option></select></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Region</label><select id="f-region"><option value="">—</option><option>Northland</option><option>Auckland</option><option>Waikato & Bay of Plenty</option><option>Gisborne</option><option>Hawke’s Bay</option><option>Wairarapa</option><option>Nelson</option><option>Marlborough</option><option>North Canterbury</option><option>Waitaki Valley</option><option>Central Otago</option><option>Other</option></select></div>
          <div class="field"><label>Sub-region</label><input id="f-sub" placeholder="e.g. Martinborough"></div>
        </div>
        <div class="field"><label>Tasting notes <span style="color:var(--muted);font-weight:400">(max 25 words)</span></label><textarea id="f-notes" rows="2" style="width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:8px;background:var(--card-2);font-family:var(--sans);font-size:14px;color:var(--ink);resize:vertical" placeholder="Cherry, plum and soft spice…"></textarea></div>
        <div class="field"><label>Food pairings <span style="color:var(--muted);font-weight:400">(up to 3, semicolon ;)</span></label><input id="f-pair" placeholder="roast duck; salmon; mushroom risotto"></div>
        <div class="field"><label>Awards <span style="color:var(--muted);font-weight:400">(semicolon ;)</span></label><input id="f-awards" placeholder="Gold · NZ IWS 2025"></div>
      </div>
      <div class="modal-foot"><button class="btn" id="m-cancel">Cancel</button><button class="btn primary" id="m-save">${ic('plus',15)} Add to my range</button></div>`;
    openModal();
    $('#m-x').onclick=closeModal; $('#m-cancel').onclick=closeModal;
    $('#m-save').onclick=()=>{
      const name=$('#f-name').value.trim(); if(!name){ toast('Give the wine a name'); return; }
      const pairs=($('#f-pair').value||'').split(';').map(s=>s.trim()).filter(Boolean).slice(0,3);
      const notes=($('#f-notes').value||'').trim().split(/\s+/).filter(Boolean).slice(0,25).join(' ');
      const w={ id:Date.now(), name, variety:$('#f-var').value, colour:$('#f-colour').value, style:$('#f-style').value, organic:$('#f-organic').value==='Y', region:$('#f-region').value, subRegion:$('#f-sub').value.trim(), notes, pairings:pairs, awards:($('#f-awards').value||'').trim(), vintage:+$('#f-vin').value||2024, price:+$('#f-price').value||0, qty:+$('#f-qty').value||0, scans:0 };
      PStore.addWine(w); closeModal(); go('wines'); toast('Added · '+name+' is live on AIWine 🍷');
    };
  }
  function openModal(){ $('#scrim').classList.add('open'); $('#modal').classList.add('open'); }
  function closeModal(){ $('#scrim').classList.remove('open'); $('#modal').classList.remove('open'); }

  // ---------- add ANOTHER winery (multi-winery logins, e.g. wine groups) ----------
  function addWineryModal(){
    $('#modal').innerHTML=`
      <div class="modal-head"><h2>Add another winery</h2><button class="btn-quiet" id="m-x">${ic('x',18)}</button></div>
      <div class="modal-body">
        <div style="font-size:13px;color:var(--ink-soft);margin-bottom:2px">Manage several wineries from this one login. Each addition is reviewed by AIWine (usually within a business day) — you'll see it in the switcher once approved.</div>
        <div class="field"><label>Winery name</label><input id="awx-name" placeholder="e.g. Mt Difficulty"></div>
        <div class="field"><label>Region</label><input id="awx-region" placeholder="e.g. Central Otago"></div>
        <div class="field"><label>Website (optional)</label><input id="awx-web"></div>
        <div id="awx-err" style="color:var(--red);font-size:12.5px"></div>
      </div>
      <div class="modal-foot">
        <button class="btn" id="m-cancel">Cancel</button>
        <button class="btn primary" id="awx-go">Submit for review</button>
      </div>`;
    openModal();
    $('#m-x').addEventListener('click',closeModal);
    $('#m-cancel').addEventListener('click',closeModal);
    $('#awx-go').addEventListener('click', async ()=>{
      const name=$('#awx-name').value.trim();
      if(!name){ $('#awx-err').textContent='Please enter the winery name.'; return; }
      const b=$('#awx-go'); b.disabled=true; b.textContent='Submitting…';
      try{
        const r=await PStore.requestAccess({ name, region:$('#awx-region').value.trim(), website:$('#awx-web').value.trim() });
        closeModal();
        toast(r==='linked'?'That winery is already on this login':'Submitted — we\u2019ll review it within a business day');
      }catch(e){ b.disabled=false; b.textContent='Submit for review'; $('#awx-err').textContent=e.message; }
    });
  }

  // ---------- auth screens (live mode) ----------
  const authShell = inner => `
      <div style="grid-column:1/-1;min-height:100vh;display:grid;place-items:center;background:linear-gradient(180deg,#241B15,var(--ink))">
        ${inner}
        <div id="toast"></div>
      </div>`;
  const authHead = title => `
          <div class="wordmark" style="color:var(--ink);font-size:20px;margin-bottom:4px">AI<span class="dot" style="background:var(--claret)"></span>Wine<span class="sfx" style="color:var(--brass)">Partner</span></div>
          <div style="font-family:var(--serif);font-size:26px;font-weight:600;margin:10px 0 18px">${title}</div>`;
  const cardStyle = 'width:min(380px,90vw);background:var(--card);border:1px solid var(--line);border-radius:14px;padding:30px 28px;box-shadow:0 30px 80px rgba(0,0,0,.4)';
  const errRow = err => err?`<div style="color:var(--red);font-size:12.5px;margin-bottom:12px">${esc(err)}</div>`:'';
  const okRow  = msg => msg?`<div style="color:var(--green);font-size:12.5px;margin-bottom:12px">${esc(msg)}</div>`:'';

  // stash of the winery details entered at signup, applied after email is verified
  const SIGNUP_STASH='aiwine-portal:signup';
  const readStash =()=>{ try{ return JSON.parse(localStorage.getItem(SIGNUP_STASH)||'null'); }catch(_){ return null; } };
  const writeStash=v =>{ try{ localStorage.setItem(SIGNUP_STASH, JSON.stringify(v)); }catch(_){} };
  const clearStash=()=>{ try{ localStorage.removeItem(SIGNUP_STASH); }catch(_){} };

  const REGION_OPTS=['Wairarapa','Martinborough','Marlborough','Central Otago','Hawke’s Bay','Nelson','Auckland','Gisborne','Waikato & Bay of Plenty','North Canterbury','Waitaki Valley','Northland','Other'];
  const regionSelect=(id,sel)=>`<select id="${id}"><option value="">Select region…</option>${REGION_OPTS.map(r=>`<option${sel===r?' selected':''}>${r}</option>`).join('')}</select>`;

  function renderLogin(err){
    document.getElementById('app').innerHTML = authShell(`
        <form id="lf" style="${cardStyle}">
          ${authHead('Winery sign in')}
          <div class="field" style="margin-bottom:12px"><label>Email</label><input id="le" type="email" autofocus></div>
          <div class="field" style="margin-bottom:14px"><label>Password</label><input id="lp" type="password"></div>
          ${errRow(err)}
          <button class="btn primary" type="submit" style="width:100%;justify-content:center">Sign in</button>
          <div style="text-align:center;font-size:12.5px;color:var(--ink-soft);margin-top:16px">New to AIWine? <a href="#" id="to-signup" style="color:var(--claret);font-weight:600">Create your winery account</a></div>
        </form>`);
    document.getElementById('to-signup').addEventListener('click', e=>{ e.preventDefault(); renderSignup(); });
    document.getElementById('lf').addEventListener('submit', async e=>{
      e.preventDefault();
      const btn=e.target.querySelector('button[type=submit]'); btn.disabled=true; btn.textContent='Signing in…';
      try {
        const r = await PStore.signIn(document.getElementById('le').value.trim(), document.getElementById('lp').value);
        if (r && r.needsSetup) { routeSetup(); return; }
        boot();
      }
      catch(ex){ renderLogin(friendly(ex.message)); }
    });
  }

  function renderSignup(err){
    document.getElementById('app').innerHTML = authShell(`
        <form id="sf" style="${cardStyle}">
          ${authHead('Create your winery account')}
          <div style="font-size:12.5px;color:var(--ink-soft);margin:-6px 0 16px;line-height:1.5">Tell us about your winery. We’ll review it (usually within a business day) and email you the moment your portal is ready.</div>
          <div class="field" style="margin-bottom:12px"><label>Your email</label><input id="se" type="email" autofocus></div>
          <div class="field" style="margin-bottom:12px"><label>Password <span style="color:var(--muted);font-weight:400">(min 6 characters)</span></label><input id="sp" type="password"></div>
          <div class="field" style="margin-bottom:12px"><label>Winery name</label><input id="sn" placeholder="e.g. Ata Rangi"></div>
          <div class="field" style="margin-bottom:12px"><label>Region</label>${regionSelect('sr')}</div>
          <div class="field" style="margin-bottom:12px"><label>Website <span style="color:var(--muted);font-weight:400">(optional)</span></label><input id="sw" placeholder="atarangi.co.nz"></div>
          <div class="field" style="margin-bottom:14px"><label>Your name <span style="color:var(--muted);font-weight:400">(optional)</span></label><input id="scn" placeholder="Contact name"></div>
          ${errRow(err)}
          <button class="btn primary" type="submit" style="width:100%;justify-content:center">Create account</button>
          <div style="text-align:center;font-size:12.5px;color:var(--ink-soft);margin-top:16px">Already have an account? <a href="#" id="to-login" style="color:var(--claret);font-weight:600">Sign in</a></div>
        </form>`);
    document.getElementById('to-login').addEventListener('click', e=>{ e.preventDefault(); renderLogin(); });
    document.getElementById('sf').addEventListener('submit', async e=>{
      e.preventDefault();
      const email=document.getElementById('se').value.trim();
      const pw=document.getElementById('sp').value;
      const details={ name:document.getElementById('sn').value.trim(), region:document.getElementById('sr').value, website:document.getElementById('sw').value.trim(), contact:document.getElementById('scn').value.trim() };
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return renderSignup('Please enter a valid email address.');
      if(pw.length<6) return renderSignup('Password must be at least 6 characters.');
      if(!details.name) return renderSignup('Please enter your winery name.');
      const btn=e.target.querySelector('button[type=submit]'); btn.disabled=true; btn.textContent='Creating…';
      try {
        writeStash(details);                    // applied after email verification
        const r = await PStore.signUp(email, pw);
        if (r.needsVerify) { renderVerify(email); return; }
        // email confirmation off → we have a session now, submit the request immediately
        await PStore.requestAccess(details);
        clearStash();
        renderPending({ wineryName: details.name, status: 'pending' });
      } catch(ex){ renderSignup(friendly(ex.message)); }
    });
  }

  function renderVerify(email){
    document.getElementById('app').innerHTML = authShell(`
        <div style="${cardStyle};text-align:center">
          ${authHead('Check your inbox')}
          <div style="font-size:13.5px;color:var(--ink-soft);line-height:1.6;margin-bottom:18px">We’ve sent a confirmation link to <b>${esc(email)}</b>. Click it to verify your email, then come back and sign in — we’ll submit your winery for review automatically.</div>
          <button class="btn primary" id="v-back" style="width:100%;justify-content:center">Back to sign in</button>
        </div>`);
    document.getElementById('v-back').addEventListener('click', ()=>renderLogin());
  }

  // signed in, email verified, but not yet linked → let them (re)submit their winery details
  function renderRequestForm(prefill, rejected){
    const p = prefill || {};
    document.getElementById('app').innerHTML = authShell(`
        <form id="rf" style="${cardStyle}">
          ${authHead('Tell us about your winery')}
          ${rejected?`<div style="color:var(--red);font-size:12.5px;margin:-6px 0 12px;line-height:1.5">Your previous request wasn’t approved${rejected.message?': '+esc(rejected.message):''}. You can update your details and re-submit.</div>`:`<div style="font-size:13px;color:var(--ink-soft);line-height:1.55;margin:-6px 0 14px">Your email is verified. Submit your winery for review and we’ll email you once your portal is ready.</div>`}
          <div class="field" style="margin-bottom:12px"><label>Winery name</label><input id="rn" value="${esc(p.wineryName||p.name||'')}" placeholder="e.g. Ata Rangi" autofocus></div>
          <div class="field" style="margin-bottom:12px"><label>Region</label>${regionSelect('rr', p.region)}</div>
          <div class="field" style="margin-bottom:12px"><label>Website <span style="color:var(--muted);font-weight:400">(optional)</span></label><input id="rw" value="${esc(p.website||'')}" placeholder="atarangi.co.nz"></div>
          <div class="field" style="margin-bottom:14px"><label>Anything we should know? <span style="color:var(--muted);font-weight:400">(optional)</span></label><input id="rm" placeholder="e.g. member of Wairarapa Winegrowers"></div>
          <button class="btn primary" type="submit" style="width:100%;justify-content:center">Submit for review</button>
          <div style="text-align:center;font-size:12px;color:var(--muted);margin-top:16px"><a href="#" id="r-signout" style="color:var(--muted)">Sign out</a></div>
        </form>`);
    document.getElementById('r-signout').addEventListener('click', async e=>{ e.preventDefault(); await PStore.signOut(); clearStash(); renderLogin(); });
    document.getElementById('rf').addEventListener('submit', async e=>{
      e.preventDefault();
      const details={ name:document.getElementById('rn').value.trim(), region:document.getElementById('rr').value, website:document.getElementById('rw').value.trim(), message:document.getElementById('rm').value.trim() };
      if(!details.name) return renderRequestForm(details, rejected);
      const btn=e.target.querySelector('button[type=submit]'); btn.disabled=true; btn.textContent='Submitting…';
      try { await PStore.requestAccess(details); clearStash(); renderPending({ wineryName: details.name, status:'pending' }); }
      catch(ex){ btn.disabled=false; btn.textContent='Submit for review'; renderRequestForm(details, rejected); toast(friendly(ex.message)); }
    });
  }

  function renderPending(req){
    document.getElementById('app').innerHTML = authShell(`
        <div style="${cardStyle};text-align:center">
          ${authHead('Awaiting approval')}
          <div style="font-size:13.5px;color:var(--ink-soft);line-height:1.6;margin-bottom:18px"><b>${esc(req&&req.wineryName||'Your winery')}</b> is in the queue for review. We’ll email you as soon as it’s approved — usually within a business day. You can then sign in and upload your range.</div>
          <button class="btn primary" id="p-check" style="width:100%;justify-content:center;margin-bottom:10px">Check status</button>
          <div style="font-size:12px;color:var(--muted)"><a href="#" id="p-signout" style="color:var(--muted)">Sign out</a></div>
        </div>`);
    document.getElementById('p-check').addEventListener('click', ()=>boot());
    document.getElementById('p-signout').addEventListener('click', async e=>{ e.preventDefault(); await PStore.signOut(); clearStash(); renderLogin(); });
  }

  // decide which setup screen a signed-in-but-unlinked user sees
  async function routeSetup(){
    const stash=readStash();
    if (stash && stash.name) {
      try { await PStore.requestAccess(stash); clearStash(); } catch(e){ /* fall through to form */ }
    }
    let req=null; try{ req=await PStore.myRequest(); }catch(_){}
    if (req && req.status==='pending')  return renderPending(req);
    if (req && req.status==='rejected') return renderRequestForm(req, req);
    return renderRequestForm(req || stash);
  }

  // map raw Supabase/RPC errors to winery-friendly copy
  function friendly(m){
    m=String(m||'');
    if(/name_required/i.test(m)) return 'Please enter your winery name.';
    if(/not_signed_in/i.test(m)) return 'Please sign in again, then submit your winery.';
    if(/invalid login/i.test(m)) return 'No account found with that email and password.';
    if(/already registered|already exists/i.test(m)) return 'An account with this email already exists — try signing in instead.';
    if(/email not confirmed/i.test(m)) return 'Please confirm your email (check your inbox), then sign in.';
    if(/password/i.test(m)) return 'Password must be at least 6 characters.';
    return m;
  }

  // ---------- boot ----------
  async function boot(){
    let r; try { r = await PStore.init(); } catch(e){ r = { ok:false, error:e.message }; }
    if (r && r.needsAuth)  { renderLogin(); return; }
    if (r && r.needsSetup) { routeSetup(); return; }
    if (PStore.mode === 'live' && (!r || r.ok === false)) {
      // live connection failed — never fall through to the demo dashboard
      renderLogin((r && r.error) || 'Could not connect. Please check your connection and try again.');
      return;
    }
    WINES = PStore.wines; ORDERS = PStore.orders;
    shell();
    go('dashboard');
    if (r && r.error) toast(r.error);
  }
  boot();
})();

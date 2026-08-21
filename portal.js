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
    chat:'<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-4-1L3 20l1.1-4A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z"/>',
    send:'<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
    refresh:'<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/>',
    heart:'<path d="M20.8 5.6a5 5 0 0 0-7 0L12 7.3l-1.8-1.7a5 5 0 0 0-7 7L12 21l8.8-8.4a5 5 0 0 0 0-7z"/>',
    map:'<path d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2zM9 3v16M15 5v16"/>',
    passport:'<path d="M4 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM9 7h6M12 11a2 2 0 1 0 0-.01zM8 18h8"/>',
    truck:'<path d="M1 3h15v13H1zM16 8h4l3 3v5h-7M5.5 19a2 2 0 1 0 0-.01M18.5 19a2 2 0 1 0 0-.01"/>',
    check:'<path d="M20 6 9 17l-5-5"/>',
    x:'<path d="M18 6 6 18M6 6l12 12"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    card:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
    download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
    leaf:'<path d="M11 20A7 7 0 0 1 4 13c0-6 7-10 16-10 0 9-4 16-9 17zM4 13c6-2 9-5 11-9"/>',
    menu:'<path d="M3 12h18M3 6h18M3 18h18"/>',
    book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    chart:'<path d="M3 3v18h18M7 16v-5M12 16V8M17 16v-9"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
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
  // ---------- winery T&C acceptance (gates the first upload) ----------
  const TERMS_VERSION='1.2';
  const termsKey=()=> 'aiwine-portal:terms:'+(PStore&&PStore.wineryId?PStore.wineryId:'demo');
  function termsAccepted(){ try{ const r=JSON.parse(localStorage.getItem(termsKey())); return !!(r&&r.version===TERMS_VERSION); }catch(e){ return false; } }
  function acceptTerms(){ try{ localStorage.setItem(termsKey(), JSON.stringify({ version:TERMS_VERSION, at:new Date().toISOString(), by:(PStore&&PStore.userEmail)||'' })); }catch(e){} }
  const CODES={ 'FOUNDING26':{price:0,label:'Founding member 2026'}, 'FOUNDING49':{price:49,label:'Founding'}, 'WAIRARAPA':{price:0,label:'Wairarapa Association'}, 'WAIRARAPA26':{price:0,label:'Wairarapa founding 2026'} };
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
  const toast = m => { const t=$('#toast'); t.innerHTML=esc(m); t.classList.remove('has-action'); t.classList.add('show'); clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),2200); };
  // Toast with an inline action (e.g. Undo). Stays up longer; action() runs on click.
  function toastAction(m, label, fn){
    const t=$('#toast'); t.innerHTML='<span>'+esc(m)+'</span>'; t.classList.add('show','has-action');
    const b=document.createElement('button'); b.className='toast-act'; b.textContent=label;
    b.onclick=()=>{ clearTimeout(t._t); t.classList.remove('show','has-action'); try{ fn(); }catch(e){} };
    t.appendChild(b); clearTimeout(t._t);
    t._t=setTimeout(()=>t.classList.remove('show','has-action'),6000);
  }
  // Lightweight in-app confirm (replaces browser confirm()). Danger-styled optional.
  function confirmModal(opts, onYes){
    const o=typeof opts==='string'?{message:opts}:opts;
    $('#modal').innerHTML=`<div class="modal-card" style="max-width:420px">
      <div class="modal-head"><h2>${esc(o.title||'Are you sure?')}</h2><button class="btn-quiet" id="cm-x" aria-label="Close">${ic('x',18)}</button></div>
      <div class="modal-body"><p style="font-size:14px;color:var(--ink-soft);line-height:1.6;margin:0">${esc(o.message||'')}</p></div>
      <div class="modal-foot"><button class="btn" id="cm-no">${esc(o.cancel||'Cancel')}</button><button class="btn ${o.danger?'danger':'primary'}" id="cm-yes">${esc(o.confirm||'Confirm')}</button></div>
    </div>`;
    openModal();
    const done=()=>closeModal();
    $('#cm-x').onclick=done; $('#cm-no').onclick=done;
    $('#cm-yes').onclick=()=>{ done(); try{ onYes(); }catch(e){} };
  }
  const bottleEl = w => `<span class="bottle" style="background:linear-gradient(160deg,${TINT[w.variety]||'#5C1B27'},#1B1410)"></span>`;
  // Shared bottle-photo accessor (same store the Wine images screen writes to).
  const WINE_IMG_KEY='aiwine-portal:wine-images';
  function wineImg(id){ try{ return (JSON.parse(localStorage.getItem(WINE_IMG_KEY))||{})[id]||''; }catch(e){ return ''; } }
  // Thumbnail for lists: the winery's uploaded photo if present, else the tint bottle.
  function wineThumb(w){ const src=w.image||wineImg(w.id); return src?`<span class="bottle" style="overflow:hidden;background:var(--card-2)"><img src="${src}" alt="" style="width:100%;height:100%;object-fit:cover"></span>`:bottleEl(w); }
  const stockPill = s => `<span class="pill ${s}">${s==='in'?'In stock':s==='low'?'Low':'Out'}</span>`;
  const stkOf = w => w.qty<=0?'out':w.qty<=8?'low':'in';
  const APP_URL = (window.PORTAL_CONFIG && window.PORTAL_CONFIG.WINERY_APP_URL) || '../apps/winery/index.html';

  let route = 'dashboard';

  // ---------- nav ----------
  const NAV = [
    { sec:'Manage' },
    { id:'dashboard', label:'Dashboard', icon:'grid' },
    { id:'orders', label:'Orders', icon:'bag', badge:()=>ORDERS.filter(o=>o.status==='new').length },
    { id:'wines', label:'My Wines', icon:'bottle' },
    { id:'payments', label:'Payments', icon:'card' },
    { id:'upload', label:'Upload list', icon:'upload' },
    { id:'images', label:'Wine images', icon:'image' },
    { id:'settings', label:'Store settings', icon:'settings' },
    { sec:'Grow' },
    { id:'plan', label:'Plans & Cellar Door', icon:'passport' },
    { id:'insights', label:'Insights', icon:'chart' },
    { id:'integrations', label:'Integrations', icon:'plug' },
    { id:'app', label:'Winery app', icon:'sparkle' },
    { sec:'Help' },
    { id:'about', label:'About AIWine', icon:'book' },
    { id:'help', label:'Ask Vine', icon:'chat', action:'help' },
  ];

  function shell(){
    const live = PStore.mode==='live';
    document.getElementById('app').innerHTML = `
      <a href="#main" class="skip-link">Skip to content</a>
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
            `<button class="nav-link"${n.action?` data-action="${n.action}"`:` data-go="${n.id}"`}>
              <span class="ic">${ic(n.icon,17)}</span>${n.label}
              ${n.badge?`<span class="badge" data-badge="${n.id}"></span>`:''}
            </button>`).join('')}
        </nav>
        <div class="side-foot">${live?`AIWine Partner`:`Demo data · sample content`}</div>
      </aside>
      <div class="main">
        <div class="topbar">
          <div style="display:flex;align-items:center;gap:14px">
            <button class="btn-quiet menu-btn" id="menu" aria-label="Open menu">${ic('menu',20)}</button>
            <span class="demo">${live?esc((PStore.wineryRegion?PStore.wineryName+' · '+PStore.wineryRegion:PStore.wineryName)||'Live'):'Demo · sample data'}</span>
          </div>
          <div class="actions">
            ${live?`<span style="font-size:13px;color:var(--ink-soft)">${esc((PStore.userEmail&&PStore.userEmail.split('@')[0])||PStore.wineryName||'')}</span>
            <button class="btn sm ghost" id="signout">Sign out</button>`:''}
          </div>
        </div>
        <div class="content" id="main" role="main" tabindex="-1">
          <div id="screen-dashboard" class="screen"></div>
          <div id="screen-wines" class="screen"></div>
          <div id="screen-images" class="screen"></div>
          <div id="screen-cellar" class="screen"></div>
          <div id="screen-orders" class="screen"></div>
          <div id="screen-payments" class="screen"></div>
          <div id="screen-settings" class="screen"></div>
          <div id="screen-upload" class="screen"></div>
          <div id="screen-insights" class="screen"></div>
          <div id="screen-integrations" class="screen"></div>
          <div id="screen-plan" class="screen"></div>
          <div id="screen-app" class="screen"></div>
          <div id="screen-about" class="screen"></div>
        </div>
      </div>
      <div class="scrim" id="scrim"></div>
      <div class="modal" id="modal"></div>
      <div id="toast"></div>
      <button class="help-fab" id="help-fab" aria-label="Get help from Vine, the AIWine assistant" aria-expanded="false"><span class="ic">${ic('chat',20)}</span><span class="lbl">Help</span></button>
      <div class="help-panel" id="help-panel" role="dialog" aria-label="AIWine help assistant">
        <div class="help-head">
          <div class="h-av">${ic('sparkle',20)}</div>
          <div class="h-tt"><div class="h-nm">Vine</div><div class="h-sub"><span class="dot"></span>AI help · always on</div></div>
          <button class="h-btn" id="help-reset" title="Start over" aria-label="Reset conversation">${ic('refresh',16)}</button>
          <button class="h-btn" id="help-close" title="Close" aria-label="Close help">${ic('x',18)}</button>
        </div>
        <div class="help-body" id="help-body"></div>
        <div class="help-foot">
          <form class="help-form" id="help-form">
            <textarea id="help-input" rows="1" placeholder="Ask about onboarding, uploads, orders…" aria-label="Ask Vine a question"></textarea>
            <button class="help-send" type="submit" id="help-send" aria-label="Send message">${ic('send',17)}</button>
          </form>
          <div class="help-note">Vine guides you through the portal · <button type="button" id="help-reset2">Reset chat</button></div>
        </div>
      </div>`;

    $('#nav').addEventListener('click', e=>{ const b=e.target.closest('[data-go],[data-action]'); if(!b) return; if(b.dataset.action==='help'){ $('#side').classList.remove('open'); $('#scrim').classList.remove('open'); openHelp(); } else if(b.dataset.go){ go(b.dataset.go); } });
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
    helpWidget();
  }

  // ---------- AI help assistant ("Vine") ----------
  const HELP_ENDPOINT = '/api/help-chat';
  const helpKey = ()=> 'aiwine-portal:help-chat:'+((PStore&&PStore.wineryId)||'demo');
  function loadHelp(){ try{ return JSON.parse(localStorage.getItem(helpKey()))||[]; }catch(e){ return []; } }
  function saveHelp(msgs){ try{ localStorage.setItem(helpKey(), JSON.stringify(msgs.slice(-40))); }catch(e){} }
  const HELP_SUGGEST = [
    'How do I get my wines live on AIWine?',
    'How do I upload my wine list?',
    'What\u2019s the fulfilment profile — which should I choose?',
    'How do orders and payments work?'
  ];
  // markdown-lite → safe HTML: paragraphs, - bullets, **bold**, auto-linked emails/URLs.
  function fmtHelp(text){
    const linkify = s => s
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
      .replace(/([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi, '<a href="mailto:$1">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    const lines = esc(String(text||'')).split(/\n/);
    let html='', list=[];
    const flush=()=>{ if(list.length){ html+='<ul>'+list.map(li=>'<li>'+linkify(li)+'</li>').join('')+'</ul>'; list=[]; } };
    lines.forEach(raw=>{
      const line=raw.trim();
      if(/^[-\u2022]\s+/.test(line)) list.push(line.replace(/^[-\u2022]\s+/,''));
      else { flush(); if(line) html+='<p>'+linkify(line)+'</p>'; }
    });
    flush();
    return html || '<p>'+linkify(esc(String(text||'')))+'</p>';
  }
  let _helpMsgs=[], _helpBusy=false;
  function helpScreenLabel(){ const n=NAV.find(x=>x.id===route); return n&&n.label ? n.label : (route||'the portal'); }
  function renderHelpBody(){
    const body=$('#help-body'); if(!body) return;
    if(!_helpMsgs.length){
      const nm = (PStore&&PStore.wineryName) ? esc(PStore.wineryName.split(' ')[0]) : 'there';
      body.innerHTML = `<div class="h-msg a h-intro"><p>Kia ora — I’m <strong>Vine</strong>, your AIWine assistant. Ask me anything about running your store, from first sign-up through to managing your wines.</p><div class="h-chips">`+
        HELP_SUGGEST.map(s=>`<button class="h-chip" data-q="${esc(s)}"><span class="ic">${ic('sparkle',15)}</span>${esc(s)}</button>`).join('')+`</div></div>`;
      body.querySelectorAll('.h-chip').forEach(c=>c.addEventListener('click',()=>sendHelp(c.dataset.q)));
    } else {
      body.innerHTML = _helpMsgs.map(m=>`<div class="h-msg ${m.role==='user'?'u':'a'}">${m.role==='user'?('<p>'+esc(m.content).replace(/\n/g,'<br>')+'</p>'):fmtHelp(m.content)}</div>`).join('');
    }
    if(_helpBusy) body.insertAdjacentHTML('beforeend','<div class="h-typing" id="h-typing"><span></span><span></span><span></span></div>');
    body.scrollTop = body.scrollHeight;
  }
  async function sendHelp(text){
    text=String(text||'').trim(); if(!text||_helpBusy) return;
    _helpMsgs.push({ role:'user', content:text }); saveHelp(_helpMsgs);
    _helpBusy=true; renderHelpBody();
    const ta=$('#help-input'); if(ta){ ta.value=''; ta.style.height='auto'; }
    const context={ screen:helpScreenLabel(), wineryName:PStore&&PStore.wineryName, region:PStore&&PStore.wineryRegion, mode:PStore&&PStore.mode, plan:(hasGrow&&hasGrow()?'Grow':(hasCellar&&hasCellar()?'Virtual Cellar Door':'Free listing')) };
    let reply='';
    try {
      const res=await fetch(HELP_ENDPOINT,{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ messages:_helpMsgs.map(m=>({role:m.role,content:m.content})), context }) });
      const data=await res.json().catch(()=>({}));
      reply = data.reply || (res.ok ? '' : '');
      if(!reply) reply = 'Sorry — I couldn’t reach the assistant just then. Please try again, or email partners@aiwine.co.nz and we’ll help you directly.';
    } catch(e){
      reply = 'I couldn’t connect just now. If this keeps happening, email partners@aiwine.co.nz and we’ll help you directly.';
    }
    _helpBusy=false;
    _helpMsgs.push({ role:'assistant', content:reply }); saveHelp(_helpMsgs);
    renderHelpBody();
  }
  function openHelp(){ const p=$('#help-panel'), f=$('#help-fab'); if(!p) return; p.classList.add('open'); f.classList.add('hide'); f.setAttribute('aria-expanded','true'); setTimeout(()=>{ const ta=$('#help-input'); if(ta&&window.innerWidth>600) ta.focus(); },220); }
  function closeHelp(){ const p=$('#help-panel'), f=$('#help-fab'); if(!p) return; p.classList.remove('open'); f.classList.remove('hide'); f.setAttribute('aria-expanded','false'); }
  function resetHelp(){ confirmModal({ title:'Reset this conversation?', message:'This clears your chat history with Vine on this device. This can\u2019t be undone.', confirm:'Reset', danger:true }, ()=>{ _helpMsgs=[]; try{ localStorage.removeItem(helpKey()); }catch(e){} renderHelpBody(); toast('Conversation reset'); const ta=$('#help-input'); if(ta) ta.focus(); }); }
  function helpWidget(){
    _helpMsgs = loadHelp(); _helpBusy=false;
    renderHelpBody();
    $('#help-fab').addEventListener('click', openHelp);
    $('#help-close').addEventListener('click', closeHelp);
    $('#help-reset').addEventListener('click', resetHelp);
    $('#help-reset2').addEventListener('click', resetHelp);
    const ta=$('#help-input');
    ta.addEventListener('input',()=>{ ta.style.height='auto'; ta.style.height=Math.min(ta.scrollHeight,120)+'px'; });
    ta.addEventListener('keydown',e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); sendHelp(ta.value); } });
    $('#help-form').addEventListener('submit',e=>{ e.preventDefault(); sendHelp(ta.value); });
    document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&$('#help-panel')&&$('#help-panel').classList.contains('open')) closeHelp(); });
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
    linkFields(el);
    el.querySelectorAll('table.tbl thead th').forEach(th=>{ if(th.textContent.trim()) th.setAttribute('scope','col'); });
    $('#side').classList.remove('open');
    if(!$('#modal').classList.contains('open')) $('#scrim').classList.remove('open');
    $('.content').scrollTo?.(0,0); window.scrollTo(0,0);
    // Move focus to the new page heading so keyboard/SR users land in the fresh content.
    const h=el.querySelector('h1.page-title'); if(h){ h.setAttribute('tabindex','-1'); h.focus({preventScroll:true}); }
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
    // ---- Getting-started checklist (onboarding sequence, state-aware) ----
    const gsKey = 'aiwine-portal:gs-dismissed:'+((PStore&&PStore.wineryId)||'demo');
    let gsDismissed=false; try{ gsDismissed=localStorage.getItem(gsKey)==='1'; }catch(e){}
    const steps = [
      { done: termsAccepted(), label:'Agree to the Winery Terms & Conditions', go:'upload', cta:'Review & agree' },
      { done: WINES.length>0, label:'Upload your wine range', go:'upload', cta:'Upload list' },
      { done: WINES.some(w=>w.img||w.image), label:'Add wine images', go:'images', cta:'Add wine images' },
      { done: !!(PStore&&PStore.ordersEmail), label:'Set fulfilment & order-notification email', go:'settings', cta:'Store settings' },
      { done: false, alwaysOpen:true, label:'Email bank account & GST number for payouts', go:'payments', cta:'How payouts work' },
    ];
    const doneN = steps.filter(s=>s.done).length;
    const allCore = steps.filter(s=>!s.alwaysOpen).every(s=>s.done);
    const showGS = !(allCore && gsDismissed);
    const firstRun = !showGS ? '' : `
      <div class="card card-pad" style="margin-bottom:20px;border-left:3px solid ${allCore?'var(--green)':'var(--claret)'}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap">
          <div><div class="card-title" style="margin-bottom:4px">${allCore?'You\u2019re all set up':'Getting started'}</div>
          <div style="font-size:13px;color:var(--ink-soft)">${allCore?'Your range is live. One last thing before your first payout \u2014 see below.':'A few steps and your wines are in front of customers. Follow them in order.'}</div></div>
          <span class="pill ${allCore?'in':'new'}" style="align-self:center">${doneN}/${steps.filter(s=>!s.alwaysOpen).length} done</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:2px;margin-top:16px">
          ${steps.map((s,i)=>`<div style="display:flex;align-items:center;gap:12px;padding:11px 0;border-top:${i?'1px solid var(--line)':'none'}">
            <span style="flex:none;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;${s.done?'background:var(--green);color:#fff':'background:#eee4d4;color:var(--muted)'}">${s.done?ic('check',13,'#fff'):(i+1)}</span>
            <div style="flex:1;font-size:13.5px;${s.done?'color:var(--muted);text-decoration:line-through':'color:var(--ink)'}">${s.label}</div>
            ${s.done?'':`<button class="btn sm ghost" data-go="${s.go}">${esc(s.cta)} \u2192</button>`}
          </div>`).join('')}
        </div>
        ${allCore?`<div style="margin-top:14px"><button class="btn sm ghost" id="gs-dismiss">Hide this checklist</button></div>`:''}
      </div>`;
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
              ${newOrders.length?newOrders.map(o=>`<div class="row-item"><span class="row-ic">${ic('bag',15)}</span><div class="row-bd"><div class="t"><b>${esc(o.items)}</b></div><div class="when">${esc(o.id)} · ${esc(o.destination)} · ${money(o.total)}</div></div></div>`).join(''):'<div style="color:var(--muted);font-size:13px;padding:8px 0">No new orders right now.</div>'}
            </div>
          </div>
          <div class="card card-pad">
            <div class="label" style="margin-bottom:14px">Where your wine travels</div>
            ${live?`<div style="color:var(--muted);font-size:13px;padding:8px 0;line-height:1.6">Once orders and scans start, you'll see where in New Zealand (and beyond) your wines end up.</div>`:REGIONS.slice(0,5).map(([r,v])=>`<div class="bar-row"><span class="bl">${r}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.round(v/186*100)}%"></div></div><span class="bv">${v}</span></div>`).join('')}
          </div>
        </div>
      </div>`;
    const gsd=el.querySelector('#gs-dismiss'); if(gsd) gsd.addEventListener('click',()=>{ try{ localStorage.setItem(gsKey,'1'); }catch(e){} RENDER.dashboard(el); toast('Checklist hidden'); });
    bindGo(el);
  };

  RENDER.wines = el => {
    el.innerHTML = `
      <div class="page-head">
        <div><div class="eyebrow">Your range</div><h1 class="page-title">My <em>wines</em>.</h1>
        <div class="sub-line">Change a price or stock level and it updates across AIWine in seconds. To edit other wine details, select the wine, edit and save.</div></div>
        <div style="display:flex;gap:10px"><button class="btn" data-go="upload">${ic('upload',15)} Bulk upload</button><button class="btn primary" id="add2">${ic('plus',15)} Add bottle</button></div>
      </div>
      <div class="card">
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr><th scope="col">Wine</th><th scope="col">Price (incl GST)</th><th scope="col">In cellar</th><th scope="col">Status</th><th scope="col" class="r">Scans</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>
          <tbody id="wines-body">${WINES.length?WINES.map(wineRow).join(''):`<tr><td colspan="6"><div class="empty-state"><div class="es-ic">${ic('bottle',26)}</div><div class="es-t">No wines yet</div><div class="es-s">Add your range and it appears here — upload a spreadsheet, or add bottles one at a time.</div><div class="es-cta"><button class="btn primary" data-go="upload">${ic('upload',15)} Upload your list</button><button class="btn" id="es-add">Add a bottle</button></div></div></td></tr>`}</tbody>
        </table></div>
      </div>
      <div style="margin-top:14px;font-size:12.5px;color:var(--muted)">${ic('check',13,'var(--green)')} Changes save instantly and sync to the app, the shop and your cellar-door listing.</div>
      <div class="card card-pad" style="margin-top:18px;display:flex;align-items:center;gap:16px;flex-wrap:wrap">
        <div style="flex:1;min-width:260px">
          <div class="card-title" style="margin-bottom:4px">How you ship &amp; case deals</div>
          <div style="font-size:12.5px;color:var(--ink-soft);line-height:1.55">Fulfilment profile, free-delivery threshold, case discounts, minimum order and mixed cases now live in one place.</div>
        </div>
        <button class="btn" data-go="settings">${ic('settings',15)} Store settings</button>
      </div>`;
    el.querySelector('#add2').addEventListener('click', addWineModal);
    bindWineRows(el); bindGo(el);
  };
  // provenance: who added / last changed a wine, and when (from the audit columns)
  function fmtWhen(iso){ if(!iso) return ''; const d=new Date(iso); if(isNaN(d)) return ''; return d.toLocaleDateString('en-NZ',{day:'numeric',month:'short',year:'numeric'}); }
  function provLine(w){
    const parts=[];
    if(w.updatedAt) parts.push('Updated '+fmtWhen(w.updatedAt)+(w.updatedBy?' · '+esc(w.updatedBy):''));
    else if(w.createdAt) parts.push('Added '+fmtWhen(w.createdAt)+(w.createdBy?' · '+esc(w.createdBy):''));
    if(!parts.length) return '';
    const title = w.createdAt?('Added '+fmtWhen(w.createdAt)+(w.createdBy?' by '+esc(w.createdBy):'')):'';
    return `<div class="wine-meta" style="font-size:10.5px;color:var(--muted);margin-top:2px" title="${title}">${parts[0]}</div>`;
  }
  function wineRow(w){
    return `<tr data-wid="${w.id}">
      <td><div class="wine-cell">${wineThumb(w)}<div><button class="wine-nm wine-edit" data-edit type="button" title="Edit ${esc(w.name)}" style="background:none;border:none;padding:0;font:inherit;color:inherit;text-align:left;cursor:pointer">${esc(w.name)}</button><div class="wine-meta">${esc(w.variety)} · ${esc(w.vintage)}</div>${provLine(w)}</div></div></td>
      <td><span class="price-edit"><span>$</span><input type="number" min="0" value="${w.price}" data-price aria-label="Price for ${esc(w.name)}, dollars incl GST"></span></td>
      <td><span class="stepper"><button data-dec aria-label="Decrease stock for ${esc(w.name)}">−</button><input type="number" min="0" value="${w.qty}" data-qty aria-label="Bottles in cellar for ${esc(w.name)}"><button data-inc aria-label="Increase stock for ${esc(w.name)}">+</button></span></td>
      <td data-stock>${stockPill(stkOf(w))}</td>
      <td class="r mono" style="font-size:12px;color:var(--muted)">${w.scans||'—'}</td>
      <td class="r"><button class="btn-quiet" data-del title="Remove" aria-label="Remove ${esc(w.name)}">${ic('x',16)}</button></td>
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
      const ed=tr.querySelector('[data-edit]'); if(ed) ed.addEventListener('click',()=>addWineModal(w));
      tr.querySelector('[data-del]').addEventListener('click',()=>{
        confirmModal({ title:'Remove wine?', message:'Remove “'+w.name+'” from your range? Customers will no longer see it. You can undo this straight after.', confirm:'Remove', danger:true }, ()=>{
          const idx=WINES.indexOf(w), snapshot=w;
          PStore.removeWine(w.id); WINES=PStore.wines; go('wines');
          toastAction('Removed “'+snapshot.name+'”', 'Undo', ()=>{ PStore.addWine(snapshot); WINES=PStore.wines; go('wines'); toast('Restored “'+snapshot.name+'”'); });
        });
      });
    });
    const esAdd=el.querySelector('#es-add'); if(esAdd) esAdd.addEventListener('click',()=>addWineModal());
    bindGo(el);
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
        <tbody>${rows.map(orderRow).join('')||`<tr><td colspan="6"><div class="empty-state"><div class="es-ic">${ic('bag',26)}</div><div class="es-t">${seg==='open'?'No orders to fulfil':'Nothing shipped yet'}</div><div class="es-s">${seg==='open'?'When a customer buys your wine, the order lands here ready to pack and ship.':'Orders you\u2019ve marked shipped will show here.'}</div></div></td></tr>`}</tbody>
      </table></div></div>
      ${PStore.mode==='live'?`
      <div class="card card-pad" style="margin-top:16px;display:flex;align-items:center;gap:16px;flex-wrap:wrap">
        <div style="flex:1;min-width:240px">
          <div class="card-title" style="font-size:16px;margin-bottom:3px">Order notifications${(PStore.wineries||[]).length>1?` \u00b7 ${esc(PStore.wineryName)}`:''}</div>
          <div style="font-size:12.5px;color:var(--ink-soft)">New orders for this winery are emailed here the moment they land. Each winery has its own address.</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <input id="oe-mail" type="email" aria-label="Order notification email" value="${esc(PStore.ordersEmail||'')}" placeholder="orders@yourwinery.co.nz" style="width:240px;padding:9px 12px;border:1px solid var(--line);border-radius:8px;background:var(--card-2);font-size:13px">
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
    const g = o.gifts && typeof o.gifts==='object' ? Object.values(o.gifts) : [];
    const wrap = g.some(x=>x&&x.wrap), msg = (g.find(x=>x&&x.message)||{}).message;
    const tags = [];
    if(o.method==='pickup') tags.push('<span class="pill low">Cellar-door pickup</span>');
    if(wrap) tags.push('<span class="pill">Gift wrap</span>');
    if(msg) tags.push(`<span class="pill" title="${esc(msg)}">Gift message</span>`);
    const tagLine = tags.length?`<div style="margin-top:5px;display:flex;gap:5px;flex-wrap:wrap">${tags.join('')}</div>`:'';
    const msgLine = msg?`<div class="wine-meta" style="margin-top:4px;font-style:italic">“${esc(msg)}”</div>`:'';
    return `<tr><td class="mono" style="font-size:12px">${esc(o.id)}<div class="wine-meta" style="margin-top:3px">${esc(o.placedAt)}</div></td><td style="font-size:13px;font-weight:600">${esc(o.items)}${tagLine}${msgLine}</td><td>${o.method==='pickup'?'Cellar-door pickup':esc(o.destination)}</td><td class="r mono">${money(o.total)}</td><td>${pill}</td><td class="r">${act}</td></tr>`;
  }

  RENDER.payments = el => {
    const live = PStore.mode==='live';
    // Demo sample payouts — in live mode this list fills from Stripe (payouts) +
    // Xero (invoices/remittances) once the winery has its first full month.
    const PAYOUTS = live ? [] : [
      { date:'5 Jun 2026', period:'May 2026', ref:'AIW-PAY-0526', orders:14, gross:2840, comm:568, gst:85.20, net:2186.80 },
      { date:'4 Jul 2026', period:'June 2026', ref:'AIW-PAY-0626', orders:19, gross:3615, comm:723, gst:108.45, net:2783.55 },
    ];
    const fm = n => '$' + n.toLocaleString('en-NZ', {minimumFractionDigits:2, maximumFractionDigits:2});
    const rows = PAYOUTS.map(p=>`
      <tr>
        <td><b>${p.date}</b></td><td>${p.period}</td><td style="font-family:var(--mono);font-size:11px">${p.ref}</td>
        <td>${p.orders}</td><td>${fm(p.gross)}</td><td>−${fm(p.comm)}</td><td>−${fm(p.gst)}</td><td><b>${fm(p.net)}</b></td>
        <td style="white-space:nowrap"><span class="pill low" style="font-size:9px">Docs soon</span></td>
      </tr>`).join('');
    el.innerHTML = `
      <div class="page-head"><div><div class="eyebrow">Money</div><h1 class="page-title"><em>Payments</em>.</h1>
        <div class="sub-line">Everything AIWine has paid ${PStore.wineryName||'your winery'}, and the paperwork that goes with it.</div></div></div>

      <div class="card card-pad" style="margin-bottom:20px">
        <div class="card-title" style="margin-bottom:6px">How you get paid</div>
        <div style="font-size:13.5px;color:var(--ink-soft);line-height:1.65">
          Customers pay AIWine at checkout. We reconcile each calendar month, deduct our <b>20% commission (+ GST on the commission)</b>, and pay your net sales into your bank account during the <b>first week of the following month</b> — September's sales are in your account in early October. Every payout below comes with a monthly <b>sales statement</b>, a <b>commission tax invoice</b> (GST No. 148-900-086) for your Xero, and a <b>remittance advice</b> matching the bank deposit to the cent.
        </div>
      </div>

      <div class="card" style="margin-bottom:20px">
        <div class="card-head"><span class="card-title">Payments to your winery</span></div>
        ${PAYOUTS.length?`
        <div style="overflow-x:auto"><table class="tbl" style="min-width:760px">
          <thead><tr><th>Paid</th><th>Period</th><th>Reference</th><th>Orders</th><th>Gross sales</th><th>Commission</th><th>GST</th><th>Net paid</th><th>Documents</th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>`:`
        <div class="card-pad" style="text-align:center;padding:44px 24px">
          <div style="font-family:var(--serif);font-size:20px;font-weight:600">No payouts yet</div>
          <div style="font-size:13px;color:var(--ink-soft);margin-top:6px;max-width:52ch;margin-left:auto;margin-right:auto">Your first payment arrives in the first week of the month after your first sale. Each one will be listed here with its statement, tax invoice and remittance advice.</div>
        </div>`}
      </div>

      <div class="two" style="margin-bottom:20px">
        <div class="card card-pad">
          <div class="card-title" style="margin-bottom:10px">Your monthly paperwork</div>
          <div style="display:flex;flex-direction:column;gap:12px;font-size:13px;color:var(--ink-soft)">
            <div><b style="color:var(--ink)">1 · Order confirmation</b> — emailed instantly with every order: order number, customer, delivery address, wines, quantities, the amount payable to you, and shipping instructions. Doubles as your packing slip.</div>
            <div><b style="color:var(--ink)">2 · Commission tax invoice</b> — one per month (not per order): gross sales, 20% commission, GST. Enter it in Xero as an expense.</div>
            <div><b style="color:var(--ink)">3 · Monthly sales statement</b> — every order line: date, wine, bottles, gross, commission, net — plus refunds and adjustments. Reconcile without logging in anywhere.</div>
            <div><b style="color:var(--ink)">4 · Remittance advice</b> — sent with each payment: date, reference, orders included, deductions, and the exact net amount deposited.</div>
          </div>
        </div>
        <div class="card card-pad">
          <div class="card-title" style="margin-bottom:10px">Stripe Connect — get paid per order <span style="font-family:var(--mono);font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--brass);border:1px solid var(--brass-soft);border-radius:999px;padding:3px 8px;margin-left:6px;vertical-align:middle">Coming</span></div>
          <div style="font-size:13px;color:var(--ink-soft);line-height:1.6">
            <p style="margin-bottom:10px">Instead of a monthly payout, Stripe Connect splits each sale <b>at the moment the customer pays</b>: your share lands in your own Stripe account (then your bank, typically within 2 business days) and AIWine's commission is deducted automatically — no waiting for month end, no invoices to chase. Your statements and remittance records still appear here.</p>
            <p style="margin-bottom:14px">Setup is a one-time onboarding through Stripe (identity + bank verification, about 10 minutes).</p>
            <a class="btn" href="mailto:tim@aiwine.co.nz?subject=Enable%20Stripe%20Connect%20—%20${encodeURIComponent(PStore.wineryName||'our winery')}" style="justify-content:center">Contact us to enable Stripe Connect</a>
          </div>
        </div>
      </div>

      <div class="card card-pad">
        <div class="card-title" style="margin-bottom:6px">Before your first payout — what we need</div>
        <div style="font-size:13px;color:var(--ink-soft);line-height:1.65">We don't collect banking details at sign-up, so before your first payment please email <a href="mailto:tim@aiwine.co.nz" style="color:var(--claret);font-weight:600">tim@aiwine.co.nz</a> with: your <b>bank account name &amp; number</b>, your <b>GST number</b> (so statements and invoices are GST-correct), and your <b>accounts email</b> if different from the orders address. One email — then everything here runs automatically.</div>
      </div>`;
  };

  RENDER.upload = el => {
    const agreed = termsAccepted();
    el.innerHTML = `
      <div class="page-head"><div><div class="eyebrow">Bulk update</div><h1 class="page-title">Upload your <em>list</em>.</h1>
      <div class="sub-line">The smoothest way is our ready-made template — it has every field (incl. tasting notes &amp; colour) with dropdowns, so your wines map first time. Download it, fill it in, drop it back.</div></div></div>
      <div class="card card-pad" id="terms-gate" style="margin-bottom:18px;border-left:3px solid ${agreed?'var(--green)':'var(--claret)'}">
        <div style="display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap">
          <div style="flex:1;min-width:240px">
            <div class="card-title" style="font-size:16px;margin-bottom:4px">${agreed?'Terms accepted':'Before you list wine'}</div>
            <div style="font-size:13px;color:var(--ink-soft);line-height:1.6">${agreed?`You've agreed to the AIWine Winery Terms &amp; Conditions (v${TERMS_VERSION}). You can <a href="terms.html" target="_blank" style="color:var(--claret);font-weight:600">re-read them here</a> at any time.`:`Listing wine on AIWine means agreeing to our Winery Terms &amp; Conditions — how commission, payouts, fulfilment and alcohol-law responsibilities work. Please <a href="terms.html" target="_blank" style="color:var(--claret);font-weight:600">read the terms</a>, then tick to continue.`}</div>
            ${agreed?'':`<label style="display:flex;gap:10px;align-items:flex-start;margin-top:14px;cursor:pointer;font-size:13.5px;color:var(--ink)">
              <input type="checkbox" id="terms-agree" style="margin-top:2px;width:17px;height:17px;accent-color:var(--claret);flex:none" />
              <span>I have read and agree to the <a href="terms.html" target="_blank" style="color:var(--claret);font-weight:600">AIWine Winery Terms &amp; Conditions</a> on behalf of my winery.</span>
            </label>`}
          </div>
          ${agreed?`<span class="pill in" style="align-self:center">${ic('check',13,'var(--green)')} Agreed</span>`:''}
        </div>
      </div>
      <div class="two" id="upload-body" style="${agreed?'':'opacity:.5;pointer-events:none;filter:grayscale(.3)'}" aria-disabled="${agreed?'false':'true'}">
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
    const agreeBox=el.querySelector('#terms-agree');
    if(agreeBox){ agreeBox.addEventListener('change',()=>{ if(agreeBox.checked){ acceptTerms(); toast('Terms accepted — you can upload now'); RENDER.upload(el); } }); }
    el.querySelector('#pick').addEventListener('click',()=>{ if(!termsAccepted()){ toast('Please agree to the Terms & Conditions first'); return; } file.click(); });
    el.querySelector('#tmpl').addEventListener('click',()=>{
      if(PStore.mode==='live'){ const a=document.createElement('a'); a.href='AIWine Wine Upload Template.xlsx'; a.download='AIWine Wine Upload Template.xlsx'; a.click(); toast('Template downloaded'); return; }
      const csv='name,variety,vintage,price,stock\nCrimson Pinot Noir,Pinot Noir,2023,32,60\n'; const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='AIWine_range_template.csv'; a.click(); toast('Template downloaded'); });
    file.addEventListener('change',e=>{ if(!termsAccepted())return; if(e.target.files[0]) parseFile(e.target.files[0], el); });
    ['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('over');}));
    ['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('over');}));
    drop.addEventListener('drop',e=>{ if(!termsAccepted()){ toast('Please agree to the Terms & Conditions first'); return; } const f=e.dataTransfer.files[0]; if(f) parseFile(f, el); });
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
      const cells=parseCSV(String(r.result));
      if(!cells.length){ prev.innerHTML='<div class="card card-pad" style="color:var(--muted)">Empty file.</div>'; return; }
      handleCells(cells, el);
    };
    r.readAsText(f);
  }
  // RFC-4180-aware CSV parse: commas and newlines inside "quoted" fields are kept
  // (wine notes / pairings routinely contain commas), and "" is a literal quote.
  // Replaces a naive split(',') that mis-aligned columns — which could publish a
  // price or stock level into the wrong column.
  function parseCSV(text){
    const rows=[]; let row=[], field='', inQuotes=false;
    text=String(text).replace(/\r\n?/g,'\n');
    for(let i=0;i<text.length;i++){
      const c=text[i];
      if(inQuotes){
        if(c==='"'){ if(text[i+1]==='"'){ field+='"'; i++; } else { inQuotes=false; } }
        else field+=c;
      } else if(c==='"'){ inQuotes=true; }
      else if(c===','){ row.push(field); field=''; }
      else if(c==='\n'){ row.push(field); rows.push(row); row=[]; field=''; }
      else field+=c;
    }
    if(field.length||row.length){ row.push(field); rows.push(row); }
    // trim each cell; drop fully-empty rows
    return rows.map(r=>r.map(c=>c.trim())).filter(r=>r.some(c=>c!==''));
  }
  // Load SheetJS for native .xlsx reading (live portal only).
  // Prefer the VENDORED copy from our own origin (no third-party CDN trust);
  // fall back to a version-PINNED CDN with crossorigin if it's absent.
  // To vendor: put xlsx.full.min.js 0.18.5 in portal/vendor/ (see vendor/DOWNLOAD.md).
  function loadXlsx(){
    return new Promise((res,rej)=>{
      if(window.XLSX) return res();
      const cdn='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      const add=(src,onerr)=>{ const s=document.createElement('script'); s.src=src; s.crossOrigin='anonymous'; s.onload=()=>res(); s.onerror=onerr; document.head.appendChild(s); };
      add('vendor/xlsx.full.min.js', ()=>add(cdn, ()=>rej(new Error('xlsx load failed'))));
    });
  }
  // shared: turn a raw cell matrix into normalised rows + render preview/confirm
  function handleCells(cells, el){
    const prev=el.querySelector('#preview');
    const live = PStore.mode==='live';
    const wineryRegion = (PStore.wineryRegion||'').trim();   // fallback when a row leaves Region blank
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
      const pair=at(c,ci.pairings).split(';').map(s=>s.trim()).filter(Boolean).slice(0,6);
      return { name, variety:snap(at(c,ci.variety),L_VAR), colour:snap(at(c,ci.colour),L_COL), vintage:at(c,ci.vintage), price:at(c,ci.price), stock:at(c,ci.stock), notes:tn.text, pairings:pair, style:snap(at(c,ci.style),L_STY), organic:/^y/i.test(at(c,ci.organic)), awards:at(c,ci.awards), region:snap(at(c,ci.region),L_REG)||wineryRegion, sub:at(c,ci.sub) };
    }).filter(Boolean);
    const matched=rows.filter(x=>WINES.some(w=>w.name.toLowerCase()===String(x.name).toLowerCase())).length;
    const noRegion=rows.filter(x=>!x.region).length;
    const regionWarn = noRegion ? `<div class="card-pad" style="background:#F7ECD9;border-bottom:1px solid var(--line-soft);border-left:3px solid var(--brass);font-size:13px;color:var(--ink);line-height:1.5"><b>${noRegion} wine${noRegion>1?'s':''} have no region.</b> Wines need a region to show on AIWine\u2019s regional pages. Add a <b>Region</b> column to your spreadsheet${wineryRegion?'':' \u2014 or set your winery\u2019s region first'}, then re-upload.${wineryRegion?' Blank rows will use your winery region (<b>'+esc(wineryRegion)+'</b>).':''}</div>` : '';
    prev.innerHTML=`<div class="card">
      <div class="card-head"><span class="card-title">Preview · ${rows.length} wines</span><span class="label">${matched} update · ${rows.length-matched} new${skipped?' · '+skipped+' example skipped':''}</span></div>
      ${regionWarn}
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Wine</th><th>Variety</th><th>Vintage</th><th>Price</th><th>Region</th><th></th></tr></thead>
      <tbody>${rows.slice(0,12).map(x=>{ const isNew=!WINES.some(w=>w.name.toLowerCase()===String(x.name).toLowerCase()); return `<tr><td style="font-weight:600">${esc(x.name)||'<span style="color:var(--red)">missing</span>'}</td><td>${esc(x.variety)}</td><td class="mono" style="font-size:12px">${esc(x.vintage)}</td><td class="mono" style="font-size:12px">${x.price?'$'+esc(x.price):''}</td><td style="font-size:12px">${x.region?esc(x.region):'<span style="color:#B23A2E;font-weight:600">— none —</span>'}</td><td>${isNew?'<span class="pill new">New</span>':'<span class="pill in">Update</span>'}</td></tr>`; }).join('')}</tbody></table></div>
      <div class="card-pad" style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--line-soft)">
        <span style="font-size:12.5px;color:var(--muted)">${rows.length>12?'+ '+(rows.length-12)+' more':'All rows shown'}${trimmedN?' · '+trimmedN+' note'+(trimmedN>1?'s':'')+' shortened to 25 words':''}</span>
        <button class="btn primary" id="confirm" ${noRegion?'disabled title="Every wine needs a region before publishing"':''}>${ic('check',15)} Confirm &amp; publish ${rows.length} wines</button>
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
    const LIVE = PStore.mode==='live';
    const CD = LIVE ? PStore.cellarInfo : { story:PLAN.story||'', hours:PLAN.hours||'', image:PLAN.image||'' };
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
          <input id="code" aria-label="Activation code" placeholder="Have an activation code?" style="flex:1;padding:10px 12px;border:1px solid var(--line);border-radius:8px;background:var(--card-2);font-size:14px">
            <button class="btn" id="act-code">Apply</button>
        </div>
        <div style="font-size:12px;color:var(--muted);margin-top:12px">Pay by card — secure Stripe checkout, activates immediately. No invoices, cancel anytime. GST receipt emailed. <a href="#" id="plan-refresh" style="color:var(--claret)">Just paid? Check activation</a></div>
      </div>`;
    const editor = `
      <div class="card">
        <div class="card-head"><span class="card-title">Your cellar door</span><span class="pill in">Active \u00b7 ${esc(PLAN.activatedVia||'subscribed')}</span></div>
        <div class="card-pad" style="display:flex;flex-direction:column;gap:14px">
          <div class="field"><label>Your story</label><textarea id="cd-story" rows="4" style="width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:8px;background:var(--card-2);font-family:var(--sans);font-size:14px;resize:vertical" placeholder="Tell visitors who you are\u2026">${esc(CD.story||'')}</textarea></div>
          <div class="field"><label>Visit / tasting hours</label><input id="cd-hours" value="${esc(CD.hours||'')}" placeholder="Fri\u2013Sun \u00b7 11am\u20134pm" style="width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:8px;background:var(--card-2);font-size:14px"></div>
          <div class="field"><label>Hero photo</label>
            <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
              <div id="cd-thumb" style="width:120px;height:80px;border-radius:8px;border:1px solid var(--line);background:var(--card-2) center/cover no-repeat;${CD.image?`background-image:url('${CD.image}')`:''};display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:11px">${CD.image?'':'No photo yet'}</div>
              <div><button class="btn" id="cd-photo-btn" type="button">${ic('upload',15)} ${CD.image?'Replace photo':'Upload photo'}</button>
              <div style="font-size:11.5px;color:var(--muted);margin-top:6px">Shown across your public profile. JPG or PNG.</div></div>
              <input type="file" id="cd-photo" accept="image/*" hidden>
            </div>
          </div>
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
      const photoBtn=el.querySelector('#cd-photo-btn'), photoIn=el.querySelector('#cd-photo');
      if(photoBtn&&photoIn){
        photoBtn.addEventListener('click',()=>photoIn.click());
        photoIn.addEventListener('change',e=>{ const f=e.target.files[0]; if(!f) return;
          if(LIVE){ photoBtn.disabled=true; photoBtn.textContent='Uploading...'; PStore.uploadCellarImage(f).then(url=>{ const t=el.querySelector('#cd-thumb'); if(t){ t.style.backgroundImage=`url('${url}')`; t.textContent=''; } toast('Hero photo uploaded'); }).catch(err=>toast('Upload failed: '+(err&&err.message||err))).then(()=>{ photoBtn.disabled=false; photoBtn.innerHTML=`${ic('upload',15)} Replace photo`; }); }
          else { const r=new FileReader(); r.onload=()=>{ PLAN.image=r.result; savePlan(); const t=el.querySelector('#cd-thumb'); if(t){ t.style.backgroundImage=`url('${r.result}')`; t.textContent=''; } toast('Hero photo added'); }; r.readAsDataURL(f); }
          photoIn.value='';
        });
      }
      el.querySelector('#cd-save').addEventListener('click',()=>{
        const story=el.querySelector('#cd-story').value, hours=el.querySelector('#cd-hours').value;
        if(LIVE){ const b=el.querySelector('#cd-save'); b.disabled=true; b.textContent='Saving...'; PStore.saveCellar({story,hours}).then(()=>toast('Cellar door published - live on your profile')).catch(err=>toast('Could not save: '+(err&&err.message||err))).then(()=>{ b.disabled=false; b.textContent='Save - publish to my profile'; }); }
        else { PLAN.story=story; PLAN.hours=hours; savePlan(); toast('Cellar door updated - live on your profile'); }
      });
    }
    const gb=el.querySelector('#grow-buy'); if(gb) gb.addEventListener('click',()=>demoCheckout(95,'grow'));
    bindGo(el);
  };

  RENDER.cellar = el => {
    const wines = WINES.length ? WINES.slice(0,6) : [
      {name:'Arapai Pinot Noir',variety:'Pinot Noir',vintage:'2022',price:48,style:'Medium-bodied',region:'Martinborough'},
      {name:'Arapai Chardonnay',variety:'Chardonnay',vintage:'2023',price:38,style:'Textural',region:'Martinborough'},
      {name:'Arapai Riesling',variety:'Riesling',vintage:'2023',price:32,style:'Off-dry',region:'Martinborough'}
    ];
    const visit = [
      { ic:'wine', k:'Tastings & glass pours', v:'At the Martinborough Brewery', sub:'Pour, taste and linger' },
      { ic:'clock', k:'Open', v:'Friday – Sunday', sub:'3pm – 7pm' }
    ];
    const story = [
      'The Good Way Wines is a small, family-run producer based in Martinborough, crafting thoughtful, small-batch wines from their Arapai vineyard. With a focus on land, people and connection, their wines reflect both place and purpose.',
      'Their intimate tasting shed is Martinborough’s smallest cellar door, built from recycled materials — a warm, personal welcome a world away from the busy tasting room.'
    ];
    el.innerHTML = `
      <div class="page-head"><div><div class="eyebrow">Example · Virtual Cellar Door</div><h1 class="page-title">The <em>Good Way</em>.</h1>
      <div class="sub-line">A preview of how your Virtual Cellar Door looks to customers on AIWine.</div></div>
      <button class="btn" data-go="plan">${ic('x',15)} Close</button></div>

      <div class="card" style="overflow:hidden">
        <!-- HERO — image + founding badge, mirroring the live winery page -->
        <div style="display:grid;grid-template-columns:1.05fr 0.95fr;gap:0;align-items:stretch">
          <div style="padding:34px 32px;display:flex;flex-direction:column;justify-content:center">
            <span style="display:inline-flex;align-items:center;gap:8px;align-self:flex-start;font-family:var(--mono);font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#7A5E33;background:color-mix(in oklab,var(--brass),var(--card) 78%);border:1px solid color-mix(in oklab,var(--brass),var(--card) 52%);padding:7px 13px;border-radius:999px;margin-bottom:20px">${ic('sparkle',12)} Wairarapa Founding Member</span>
            <div style="font-family:var(--mono);font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--brass);margin-bottom:14px">Cellar Door · Martinborough</div>
            <div style="font-family:var(--serif);font-size:40px;font-weight:500;line-height:.98;letter-spacing:-.01em;margin-bottom:16px">The Good&nbsp;Way.</div>
            <div style="font-size:15px;line-height:1.65;color:var(--ink-soft);max-width:46ch">A small, family-run producer crafting thoughtful, small-batch wines from their Arapai vineyard — wines that reflect both place and purpose.</div>
          </div>
          <div style="position:relative;background:#2a1019;min-height:520px">
            <img src="assets/the-good-way.jpg" alt="Pouring a tasting at The Good Way cellar door in Martinborough" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:block" />
            <div style="position:absolute;inset:12px;border:1px solid rgba(255,255,255,.25);pointer-events:none"></div>
          </div>
        </div>

        <!-- WINES -->
        <div class="card-pad" style="border-top:1px solid var(--line-soft);background:var(--bg-alt)">
          <div class="label" style="color:var(--claret);margin-bottom:4px">The wines</div>
          <div style="font-family:var(--serif);font-size:24px;margin-bottom:16px">From <em style="font-style:italic;color:var(--claret)">The Good Way</em>.</div>
          <div class="grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px">
            ${wines.map(w=>{ const tint=TINT[w.variety]||'#6B1F2A'; return `
              <div style="border:1px solid var(--line);background:var(--card);overflow:hidden">
                <div style="aspect-ratio:4/5;position:relative;padding:18px;color:rgba(255,255,255,.95);display:flex;flex-direction:column;justify-content:space-between;background:linear-gradient(180deg,${tint} 0%, color-mix(in oklab,${tint},black 28%) 100%)">
                  <div style="position:absolute;inset:12px;border:1px solid rgba(255,255,255,.18);pointer-events:none"></div>
                  <div style="font-family:var(--mono);font-size:9px;letter-spacing:.16em;text-transform:uppercase;opacity:.85">${esc(w.variety)} · ${esc(w.vintage)}</div>
                  <div><div style="font-family:var(--mono);font-size:10px;letter-spacing:.16em;text-transform:uppercase;margin-bottom:6px">The Good Way</div>
                  <div style="font-family:var(--serif);font-size:22px;line-height:1.05;font-style:italic">${esc(w.name)}</div></div>
                  <div style="display:flex;justify-content:space-between;align-items:flex-end;font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;opacity:.85"><span>${esc(w.style||'')}</span><span>${esc(w.region||'Martinborough')}</span></div>
                </div>
                <div style="padding:14px 16px;display:flex;justify-content:space-between;align-items:center">
                  <span style="font-family:var(--mono);font-size:15px;font-weight:500">$${(+w.price||0).toFixed(0)}</span>
                  <span style="padding:8px 15px;border:1px solid var(--ink);border-radius:999px;font-size:11px;font-weight:600">Add to case</span>
                </div>
              </div>`; }).join('')}
          </div>
        </div>

        <!-- STORY + VISIT -->
        <div class="card-pad" style="border-top:1px solid var(--line-soft);display:grid;grid-template-columns:1.4fr 1fr;gap:36px;align-items:start">
          <div>
            <div class="label" style="color:var(--claret);margin-bottom:4px">The story</div>
            <div style="font-family:var(--serif);font-size:26px;line-height:1.08;margin-bottom:16px">Small batches, <em style="font-style:italic;color:var(--claret)">made with care</em>.</div>
            ${story.map(p=>`<p style="font-size:15px;line-height:1.75;color:var(--ink-soft);margin-bottom:14px;max-width:60ch">${esc(p)}</p>`).join('')}
          </div>
          <aside style="background:var(--card-2);border:1px solid var(--line);padding:24px">
            <div style="font-family:var(--mono);font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--brass);display:flex;align-items:center;gap:10px;margin-bottom:16px">Visit <span style="flex:1;height:1px;background:var(--line)"></span></div>
            ${visit.map((v,i)=>`
              <div style="display:flex;gap:13px;padding:14px 0;${i<visit.length-1?'border-bottom:1px solid var(--line)':''}">
                <div style="width:36px;height:36px;border-radius:9px;flex:none;background:var(--bg-alt);display:flex;align-items:center;justify-content:center;color:var(--claret)">${ic(v.ic==='wine'?'sparkle':'passport',18)}</div>
                <div><div style="font-family:var(--mono);font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:4px">${esc(v.k)}</div>
                <div style="font-family:var(--serif);font-size:20px;line-height:1.2">${esc(v.v)}</div>
                <div style="font-size:12.5px;color:var(--ink-soft);margin-top:2px">${esc(v.sub)}</div></div>
              </div>`).join('')}
            <div style="margin-top:18px;font-size:12px;line-height:1.55;color:var(--muted);padding-top:16px;border-top:1px solid var(--line)">Cellar-door details are kept simple and current. Hours can change seasonally and around vintage.</div>
          </aside>
        </div>
      </div>
      <div style="font-size:12px;color:var(--muted);margin-top:14px;text-align:center">This is a preview of a live cellar door on AIWine. Activate the Virtual Cellar Door to publish yours.</div>`;
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

  // ---------- Store settings ----------
  const SET_KEY = 'aiwine-portal:store-settings';
  const SET_DEFAULTS = { fulfil:'any', freeThreshold:6, dozenOn:false, dozenRate:10, tiers:[], minOrder:1, mixed:true, paused:false, pausedUntil:'', allocOn:false, allocCap:6, allocWines:[], pickup:true, giftMsg:false, giftWrap:false };
  function loadSet(){ let s={}; try{ s=JSON.parse(localStorage.getItem(SET_KEY))||{}; }catch(e){} const o=Object.assign({}, SET_DEFAULTS, s); if(PStore.mode==='live'){ Object.assign(o, PStore.storeSettings||{}); o.fulfil = PStore.fulfilment || o.fulfil; } return o; }
  function saveSet(s){ try{ localStorage.setItem(SET_KEY, JSON.stringify(s)); }catch(e){} }

  RENDER.settings = el => {
    const s = el._set || (el._set = loadSet());
    const rerender = () => { RENDER.settings(el); };
    const seg = (name, val, opts) => `<div class="seg" data-seg="${name}">${opts.map(o=>`<button data-val="${o[0]}" class="${String(val)===String(o[0])?'on':''}">${o[1]}</button>`).join('')}</div>`;
    const sw = (name, on) => `<label class="sw"><input type="checkbox" data-sw="${name}" ${on?'checked':''}><span class="tr"></span></label>`;

    el.innerHTML = `
      <div class="page-head">
        <div><div class="eyebrow">Your winery</div><h1 class="page-title">Store <em>settings</em>.</h1>
        <div class="sub-line">How your wines sell on AIWine. Each setting syncs to the shop, the app and your cellar-door listing.</div></div>
      </div>

      <div class="set-group">
        <div class="gh"><span class="eyebrow">Selling &amp; cases</span><span class="gl"></span></div>
        <div class="set-card">

          <div class="set-row">
            <div class="info"><h3>How you ship · fulfilment profile</h3>
              <p><b>ANY QUANTITY</b> lets customers buy 1+ bottles ($12 delivery under six). <b>SIXES &amp; TWELVES ONLY</b> means your wines always ship as complete cartons — the AI sommelier helps the customer fill the case.</p></div>
            <div class="set-ctl">${seg('fulfil', s.fulfil, [['any','Any quantity'],['cases','6s & 12s only']])}</div>
          </div>

          <div class="set-row">
            <div class="info"><h3>Free-delivery threshold <span class="funded win">Winery-funded</span></h3>
              <p>Where your winery-funded free delivery kicks in. Most choose six (the Discovery Six); pick twelve if you'd rather only cover freight on a full case.</p></div>
            <div class="set-ctl">${seg('freeThreshold', s.freeThreshold, [[6,'6 bottles'],[12,'12 bottles']])}</div>
          </div>

          <div class="set-row">
            <div class="info"><h3>Discovery Dozen discount <span class="funded win">Winery-funded</span></h3>
              <p>Reward a full case of 12 with a discount off the wine. Free delivery on 12 applies either way. <b>Off by default</b>; turn it on and choose the rate.</p></div>
            <div class="set-ctl">${sw('dozenOn', s.dozenOn)}
              <div class="sub-ctl ${s.dozenOn?'':'dim'}">Rate <select data-sel="dozenRate">${[5,10,12.5,15,20].map(r=>`<option ${s.dozenRate==r?'selected':''}>${r}%</option>`).join('')}</select></div>
            </div>
          </div>

          <div class="set-row">
            <div class="info"><h3>Volume tiers <span class="funded win">Winery-funded</span></h3>
              <p>Optional deeper case deals for bigger orders — e.g. 15% at two dozen. Leave empty to keep it simple.</p></div>
            <div class="set-ctl"><div class="tiers">
              ${(s.tiers||[]).map((t,i)=>`<div class="tier"><input type="number" data-tier-pct="${i}" value="${t.pct}" style="width:52px"/>% at <input type="number" data-tier-btls="${i}" value="${t.btls}" min="24" step="6"/> btls <span class="x" data-tier-x="${i}">✕</span></div>`).join('')}
              <button class="btn sm ghost" data-tier-add>+ Add tier</button>
            </div></div>
          </div>

          <div class="set-row">
            <div class="info"><h3>Minimum order</h3>
              <p>Fewest bottles a customer must buy from your winery before checkout. Set to 1 for no minimum.</p></div>
            <div class="set-ctl"><span class="stepper"><button data-step="minOrder" data-d="-1">−</button><input data-num="minOrder" value="${s.minOrder}"><button data-step="minOrder" data-d="1">+</button></span></div>
          </div>

          <div class="set-row">
            <div class="info"><h3>Mixed cases</h3>
              <p>Allow customers to mix your different wines into one case. Turn off if a case must be a single wine.</p></div>
            <div class="set-ctl">${sw('mixed', s.mixed)}</div>
          </div>

        </div>
      </div>

      <div class="set-group">
        <div class="gh"><span class="eyebrow">Availability</span><span class="gl"></span></div>
        <div class="set-card">

          <div class="set-row">
            <div class="info"><h3>Pause selling · holiday mode</h3>
              <p>Temporarily stop taking orders — over vintage or a break — without unpublishing your wines. They reappear the moment you switch it back on.</p></div>
            <div class="set-ctl">${sw('paused', s.paused)}
              <div class="sub-ctl ${s.paused?'':'dim'}">Until <input type="date" data-date="pausedUntil" value="${s.pausedUntil||''}"></div>
            </div>
          </div>

          <div class="set-row">
            <div class="info"><h3>Per-wine allocation cap</h3>
              <p>Limit how many bottles of a scarce wine one customer can buy per order. Turn on, set the cap, and choose which wines it applies to.</p></div>
            <div class="set-ctl">${sw('allocOn', s.allocOn)}
              <div class="sub-ctl ${s.allocOn?'':'dim'}">Max <span class="stepper"><button data-step="allocCap" data-d="-1">−</button><input data-num="allocCap" value="${s.allocCap}"><button data-step="allocCap" data-d="1">+</button></span> / order</div>
              ${s.allocOn?`<div class="alloc-wines">${(WINES.length?WINES:[{id:'demo',name:'Add wines to choose'}]).map(w=>`<label><input type="checkbox" data-alloc="${w.id}" ${(s.allocWines||[]).indexOf(String(w.id))>=0?'checked':''}> ${esc(w.name)}</label>`).join('')}</div>`:''}
            </div>
          </div>

          <div class="set-row">
            <div class="info"><h3>Local pickup · cellar-door collection</h3>
              <p>Offer a $0 “collect in person” option at checkout for locals — no freight, straight from your cellar door.</p></div>
            <div class="set-ctl">${sw('pickup', s.pickup)}</div>
          </div>

        </div>
      </div>

      <div class="set-group">
        <div class="gh"><span class="eyebrow">Presentation &amp; extras</span><span class="gl"></span></div>
        <div class="set-card">

          <div class="set-row">
            <div class="info"><h3>Gift message</h3>
              <p>Let customers add a personal gift message to orders from your winery.</p></div>
            <div class="set-ctl">${sw('giftMsg', s.giftMsg)}</div>
          </div>

          <div class="set-row">
            <div class="info"><h3>Gift wrap</h3>
              <p>Offer gift wrapping at checkout for orders from your winery.</p></div>
            <div class="set-ctl">${sw('giftWrap', s.giftWrap)}</div>
          </div>

          <div class="set-row">
            <div class="info"><h3>AIWine subscriber discount <span class="funded">AIWine-funded</span></h3>
              <p>App subscribers get an extra 10% — funded by AIWine, never a cost to you. Shown here so you can see every discount a customer might receive.</p></div>
            <div class="set-ctl"><span class="pill in">Always on · AIWine</span></div>
          </div>

        </div>
      </div>

      <div class="save-bar">
        <span class="note">${ic('check',14,'var(--green)')} Changes save as you go and sync to the shop, the app &amp; your cellar-door listing.</span>
        <div style="display:flex;gap:10px;align-items:center">${(PStore.wineries||[]).length>1?`<button class="btn ghost" id="set-apply-all" title="Copy these settings to every winery you manage">Apply to all my wineries (${PStore.wineries.length})</button>`:''}<button class="btn ghost" id="set-reset">Reset</button><button class="btn primary" id="set-save">Save settings</button></div>
      </div>`;

    const persist = async (toastMsg) => {
      saveSet(s);
      if(PStore.mode==='live'){
        try{ await PStore.setFulfilment(s.fulfil); await PStore.setStoreSettings(s); }
        catch(e){ toast('Saved locally — live sync failed: '+((e&&e.message)||e)); return; }
      }
      if(toastMsg) toast(toastMsg);
    };
    el.querySelectorAll('[data-seg]').forEach(g=>g.addEventListener('click',e=>{ const b=e.target.closest('[data-val]'); if(!b) return; let v=b.dataset.val; if(g.dataset.seg==='freeThreshold') v=+v; s[g.dataset.seg]=v; rerender(); persist('Saved'); }));
    el.querySelectorAll('[data-sw]').forEach(c=>c.addEventListener('change',()=>{ s[c.dataset.sw]=c.checked; rerender(); persist('Saved'); }));
    el.querySelectorAll('[data-sel]').forEach(sel=>sel.addEventListener('change',()=>{ s[sel.dataset.sel]=parseFloat(sel.value); persist('Saved'); }));
    el.querySelectorAll('[data-date]').forEach(d=>d.addEventListener('change',()=>{ s[d.dataset.date]=d.value; persist('Saved'); }));
    el.querySelectorAll('[data-num]').forEach(n=>n.addEventListener('change',()=>{ s[n.dataset.num]=Math.max(n.dataset.num==='minOrder'?1:1,+n.value||1); rerender(); persist('Saved'); }));
    el.querySelectorAll('[data-step]').forEach(btn=>btn.addEventListener('click',()=>{ const k=btn.dataset.step; s[k]=Math.max(1,(+s[k]||1)+(+btn.dataset.d)); rerender(); persist('Saved'); }));
    el.querySelectorAll('[data-alloc]').forEach(c=>c.addEventListener('change',()=>{ const id=c.dataset.alloc; s.allocWines=s.allocWines||[]; const i=s.allocWines.indexOf(id); if(c.checked&&i<0)s.allocWines.push(id); else if(!c.checked&&i>=0)s.allocWines.splice(i,1); persist('Saved'); }));
    const tadd=el.querySelector('[data-tier-add]'); if(tadd) tadd.addEventListener('click',()=>{ s.tiers=s.tiers||[]; s.tiers.push({pct:15,btls:24}); rerender(); persist('Saved'); });
    el.querySelectorAll('[data-tier-x]').forEach(x=>x.addEventListener('click',()=>{ s.tiers.splice(+x.dataset.tierX,1); rerender(); persist('Saved'); }));
    el.querySelectorAll('[data-tier-pct]').forEach(inp=>inp.addEventListener('change',()=>{ s.tiers[+inp.dataset.tierPct].pct=+inp.value||0; persist('Saved'); }));
    el.querySelectorAll('[data-tier-btls]').forEach(inp=>inp.addEventListener('change',()=>{ s.tiers[+inp.dataset.tierBtls].btls=Math.max(24,+inp.value||24); persist('Saved'); }));
    el.querySelector('#set-save').addEventListener('click',()=>persist('Settings saved'));
    const applyAll=el.querySelector('#set-apply-all');
    if(applyAll) applyAll.addEventListener('click',async()=>{
      const n=(PStore.wineries||[]).length;
      if(!confirm('Apply these store settings to ALL '+n+' wineries you manage?\n\nThis overwrites each winery\u2019s current store settings with the ones shown here.')) return;
      saveSet(s); applyAll.disabled=true; const orig=applyAll.textContent; applyAll.textContent='Applying\u2026';
      if(PStore.mode==='live'){
        try{ const r=await PStore.applySettingsToAll(Object.assign({},s,{fulfil:s.fulfil}));
          toast(r.ok?('Applied to all '+n+' wineries \u2713'):('Applied \u2014 but failed for: '+r.fail.join(', ')));
        }catch(e){ toast('Apply-all failed: '+((e&&e.message)||e)); }
      } else toast('Applied to all (demo)');
      applyAll.disabled=false; applyAll.textContent=orig;
    });
    el.querySelector('#set-reset').addEventListener('click',()=>{ if(confirm('Reset store settings to defaults?')){ el._set=Object.assign({},SET_DEFAULTS); saveSet(el._set); rerender(); toast('Reset to defaults'); } });
    bindGo(el);
  };

  RENDER.about = el => {
    // Content is deliberately checked against what the portal + cart ACTUALLY do
    // (fulfilment profiles, dozen discounts, published flag, store settings,
    // 20% commission in _pricing.js, monthly payout in terms.html). Where a
    // feature isn't live yet it is described as coming, not offered.
    const q = (title, body) => `
      <div class="card card-pad" style="margin-bottom:14px">
        <div class="card-title" style="font-family:var(--serif);font-size:20px;margin-bottom:8px">${title}</div>
        <div style="font-size:14px;color:var(--ink-soft);line-height:1.68">${body}</div>
      </div>`;
    const li = items => `<ul style="margin:10px 0 0;padding-left:20px">${items.map(i => `<li style="margin-bottom:7px">${i}</li>`).join('')}</ul>`;

    el.innerHTML = `
      <div class="page-head">
        <div><div class="eyebrow">About</div>
        <h1 class="page-title">About <em>AIWine</em>.</h1>
        <div class="sub-line">What we do, what it costs, and how you stay in control of your wine.</div></div>
      </div>

      ${q('What is AIWine?',
        'AIWine is a New Zealand wine discovery and online marketplace that uses AI to match people with wines they\u2019ll love, while giving wineries a simple virtual cellar door to sell directly to customers.')}

      ${q('Is there a cost?',
        '<b>Uploading your wines and wine images is free.</b> There are no listing fees and no subscription required to sell.' +
        '<div style="margin-top:10px">AIWine takes a <b>20% commission (plus GST on that commission) only when we sell a wine for you</b>. If nothing sells, you pay nothing.</div>' +
        '<div style="margin-top:12px;padding:12px 14px;background:#f6efe6;border-left:3px solid var(--claret);border-radius:0 8px 8px 0"><b>Founding members: your Virtual Cellar Door is free for the first 12 months.</b> Enter code <b>FOUNDING26</b> under Plans &amp; Cellar Door to activate it. It renews at $95/yr after the first year, and you can cancel any time.</div>')}

      ${q('Can I control how I sell my wine?',
        'Yes \u2014 you set the rules and the cart follows them everywhere on AIWine. In <b>Store settings</b> you control:' +
        li([
          '<b>Single bottles, sixes or twelves</b> \u2014 choose whether you sell individual bottles or in cases only',
          '<b>Case discounts</b> \u2014 set your own dozen discount rate, and volume tiers for larger orders',
          '<b>Free delivery threshold</b> and minimum order size',
          '<b>Which wines you offer</b> \u2014 publish or unpublish any wine at any time',
          '<b>Stock and availability</b> \u2014 update from the portal or the winery app',
          '<b>Cellar-door pickup</b>, gift messages, and pausing sales while you\u2019re away',
        ]) +
        `<div style="margin-top:14px"><button class="btn" data-go="settings">Open Store settings \u2192</button></div>`)}

      ${q('How do I get paid?',
        '<b>Monthly payment.</b> The customer pays AIWine at checkout. We deduct our commission and pay the balance to your nominated bank account in the <b>first week of the following month</b>, with a sales statement and remittance advice for your records.' +
        '<div style="margin-top:12px;padding:12px 14px;background:#f6efe6;border-radius:8px;font-size:13.5px"><b>Coming — direct payment via Stripe Connect.</b> Funds released to your nominated account within a couple of working days of each sale, rather than monthly (Stripe fees apply). Not available yet — we’ll let you know the moment it is.</div>')}

      ${q('Why should I join?',
        li([
          'Get your wines in front of customers who are <b>actively looking for wine</b>',
          'Our AI recommends your wines based on the flavour profiles each customer enjoys \u2014 grounded in <b>what you actually have in stock</b>',
          'Your own Virtual Cellar Door, without having to build one',
          'You stay in control of your wines, pricing and fulfilment',
          'AIWine handles the customer payment and the order process',
          '<b>You fulfil the order \u2014 we send you the sale</b>',
          'Built specifically to help New Zealand wineries sell more wine directly to consumers',
        ]))}

      <div class="card card-pad" style="border-left:3px solid var(--claret)">
        <div class="label" style="color:var(--brass);margin-bottom:8px">The simple proposition</div>
        <div style="font-family:var(--serif);font-size:22px;line-height:1.35">List your wines for free.<br />Let AIWine find the customers.<br />You fulfil the orders.</div>
      </div>

      <div style="font-size:12.5px;color:var(--muted);margin-top:18px;line-height:1.6">
        Full commercial terms are in the <a href="terms.html" target="_blank" style="color:var(--claret);font-weight:600">Winery Terms &amp; Conditions</a>. Questions? <b>Ask Vine</b> in the sidebar, or email <a href="mailto:hello@aiwine.co.nz" style="color:var(--claret)">hello@aiwine.co.nz</a>.
      </div>`;
    bindGo(el);
  };

  RENDER.integrations = el => {
    el.innerHTML=`
      <div class="page-head"><div><div class="eyebrow">Connect</div><h1 class="page-title"><em>Integrations</em>.</h1>
      <div class="sub-line">Keep your range in sync — from a simple spreadsheet today to full till &amp; store automation.</div></div></div>
      <div class="label" style="margin:4px 0 12px">Available now</div>
      <div class="int-grid">
        ${intCard('upload','CSV / Excel upload','Available now','in','Upload a spreadsheet whenever your range changes. We match columns automatically and you confirm before publishing.','Go to upload','upload')}
        ${intCard('grid','Live dashboard','Available now','in','Edit prices and stock directly here — every change syncs to AIWine in seconds. No spreadsheets needed.','Manage wines','wines')}
        ${intCard('bottle','Wine images','Available now','in','Add a photo to each wine — upload beside each wine in Wine images.','Add wine images','images')}
      </div>
      <div class="label" style="margin:26px 0 12px">On the roadmap</div>
      <div class="card card-pad roadmap">
        <div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap">
          <div style="flex:none;width:44px;height:44px;border-radius:10px;background:var(--bg-alt);display:flex;align-items:center;justify-content:center;color:var(--muted)">${ic('plug',22)}</div>
          <div style="flex:1;min-width:260px">
            <div class="card-title" style="margin-bottom:4px">Point-of-sale, e-commerce &amp; accounting sync</div>
            <div style="font-size:13px;color:var(--ink-soft);line-height:1.6;margin-bottom:12px">We're building direct sync so your cellar-door till and online shop keep AIWine stock current automatically, plus an open API and accounting export. Tell us which you'd use and we'll prioritise it — and let you know the moment it's ready.</div>
            <div class="road-chips">${['Open API &amp; webhooks','Shopify','WooCommerce','Squarespace','Vend by Lightspeed','Square','Lightspeed Retail','EPOS Now','Xero','Cin7 Core'].map(n=>`<span class="road-chip">${n}</span>`).join('')}</div>
            <div style="margin-top:14px"><a class="btn primary" href="mailto:partners@aiwine.co.nz?subject=Integration%20interest&body=Which%20integrations%20would%20you%20use%3F" style="justify-content:center">Register interest ↗</a></div>
          </div>
        </div>
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
    const LIVE = PStore.mode==='live';
    const BGR_KEY='aiwine-portal:bgr';
    const bgrOn=()=>{ const c=document.getElementById('bgr-toggle'); return c?c.checked:(localStorage.getItem(BGR_KEY)!=='0'); };
    let _bgr=null;
    const loadBgr=()=>{ if(!_bgr) _bgr=import('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.5/+esm'); return _bgr; };
    // Optional free, in-browser background removal, THEN normalize to the standard
    // frame. Falls back to the original file if the model can't load.
    function prep(file, cb){
      if(!bgrOn()){ normalizeBottle(file, cb); return; }
      loadBgr().then(m=>{ const fn=m.removeBackground||(m.default&&m.default.removeBackground)||m.default; return fn(file); })
        .then(blob=>normalizeBottle(blob, cb))
        .catch(()=>{ normalizeBottle(file, cb); });
    }
    let imgs; try{ imgs=JSON.parse(localStorage.getItem(KEY))||{}; }catch(e){ imgs={}; }
    const save=()=>{ try{ localStorage.setItem(KEY,JSON.stringify(imgs)); return true; }catch(e){ return false; } };
    const slug=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    // Normalize EVERY bottle photo to one standard frame so cards look consistent:
    // trim the empty/near-white margin, then fit the bottle into a 640×854 (3:4)
    // TRANSPARENT PNG, centred and bottom-anchored to match the card's bottle slot.
    // Also reports whether the source had real transparency — an opaque image shows
    // as a box on the site, so we warn the winery to use a cut-out PNG.
    function normalizeBottle(file, cb){
      const r=new FileReader();
      r.onload=()=>{ const img=new Image(); img.onload=()=>{
        try{
          const iw=img.width, ih=img.height;
          const s=document.createElement('canvas'); s.width=iw; s.height=ih;
          const sx=s.getContext('2d'); sx.drawImage(img,0,0);
          let data=null; try{ data=sx.getImageData(0,0,iw,ih).data; }catch(e){}
          let minX=iw,minY=ih,maxX=0,maxY=0,hasAlpha=false;
          if(data){
            for(let y=0;y<ih;y++){ for(let x=0;x<iw;x++){ const i=(y*iw+x)*4, a=data[i+3];
              if(a<250) hasAlpha=true;
              const nearWhite=data[i]>245&&data[i+1]>245&&data[i+2]>245;
              if(a>12 && !nearWhite){ if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y; } } }
          }
          if(minX>maxX){ minX=0;minY=0;maxX=iw-1;maxY=ih-1; }
          const cw=maxX-minX+1, ch=maxY-minY+1;
          const FW=640, FH=854;
          const scale=Math.min((FW*0.86)/cw, (FH*0.92)/ch);
          const dw=Math.round(cw*scale), dh=Math.round(ch*scale);
          const dx=Math.round((FW-dw)/2), dy=Math.round(FH-dh-FH*0.04);
          const out=document.createElement('canvas'); out.width=FW; out.height=FH;
          out.getContext('2d').drawImage(img, minX,minY,cw,ch, dx,dy,dw,dh);
          out.toBlob(b=>{ cb({ dataUrl: out.toDataURL('image/png'), blob: b||file, transparent: hasAlpha }); }, 'image/png');
        }catch(e){ cb({ dataUrl:r.result, blob:file, transparent:true }); }
      }; img.onerror=()=>cb({ dataUrl:r.result, blob:file, transparent:true }); img.src=r.result; };
      r.readAsDataURL(file);
    }
    let target=null;
    const single=document.createElement('input'); single.type='file'; single.accept='image/*';
    // live: current photo is the wine's saved image_url; demo: localStorage map
    const imgOf = w => LIVE ? (w.image||'') : (imgs[w.id]||'');
    single.addEventListener('change',e=>{ const f=e.target.files[0]; if(!f||!target){ single.value=''; target=null; return; } const t=target; single.value=''; target=null;
      prep(f, res=>{
        if(LIVE){ PStore.uploadWineImage(t,res.blob).then(()=>{ WINES=PStore.wines; draw(); toast(res.transparent?'Photo uploaded — live on the site':'Photo uploaded'); }).catch(err=>{ toast('Upload failed: '+(err&&err.message||err)); }); }
        else { imgs[t]=res.dataUrl; if(save()){ draw(); toast('Photo added'); } else { delete imgs[t]; draw(); toast('Couldn’t save — photo too large for local storage.'); } }
      });
    });
    function handleFiles(files){
      const arr=[...files].filter(f=>/^image\//.test(f.type)); if(!arr.length) return;
      const match=f=>{ const base=slug(f.name.replace(/\.[^.]+$/,'')); return WINES.find(x=>{ const s1=slug(x.name+'-'+(x.vintage||'')); const s2=slug(x.name); return base===s1||base===s2||(s2&&base.indexOf(s2)>=0); }); };
      let done=0, matched=0, un=0, opaque=0; const total=arr.length;
      const finish=()=>{ if(++done<total) return; const ok=LIVE||save(); if(LIVE){ WINES=PStore.wines; } draw();
        toast((ok?(matched+(LIVE?' uploaded':' matched')):'Couldn’t save all — storage full')+(un?' · '+un+' unmatched':'')+(opaque?' · '+opaque+' had a solid background (use cut-out PNGs)':'')+(LIVE&&ok?' — live on the site':'')); };
      arr.forEach(f=>{ const w=match(f); if(!w){ un++; finish(); return; }
        prep(f, res=>{ if(!res.transparent) opaque++;
          if(LIVE){ PStore.uploadWineImage(w.id,res.blob).then(()=>{matched++;}).catch(()=>{un++;}).then(finish); }
          else { imgs[w.id]=res.dataUrl; matched++; finish(); }
        }); });
    }
    function draw(){
      el.innerHTML = `
        <div class="page-head"><div><div class="eyebrow">Wine images</div><h1 class="page-title">Wine <em>images</em>.</h1>
        <div class="sub-line">Add one photo per wine — use the Upload button beside each wine below.</div></div>
        <label style="display:inline-flex;align-items:center;gap:7px;font-size:12.5px;color:var(--ink-soft);cursor:pointer"><input type="checkbox" id="bgr-toggle" ${localStorage.getItem(BGR_KEY)!=='0'?'checked':''} style="width:16px;height:16px;accent-color:var(--claret)">Auto-remove background</label></div>
        <div class="card card-pad" style="margin-top:12px;display:flex;gap:12px;align-items:flex-start"><span style="flex:none;color:var(--claret);margin-top:1px">${ic('image',18)}</span><div style="font-size:12.5px;color:var(--ink-soft);line-height:1.6"><b>How your photo is prepared.</b> Every photo is trimmed, sized and centred to match the others, so your range looks consistent. With <b>Auto-remove background</b> on (recommended), we lift the bottle off its background for you. If it’s off and your photo has a <b>solid white or coloured background</b>, that background will show as a box behind the bottle — for the cleanest result, upload a bottle already cut out on a transparent background, or leave Auto-remove background on.</div></div>
        <input type="file" id="fileall" accept="image/*" multiple hidden>
        <div class="card" style="margin-top:18px"><div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>Photo</th><th>Wine</th><th>File name to use</th><th></th></tr></thead>
          <tbody>${WINES.map(w=>{ const src=imgOf(w); const fn=slug(w.name+'-'+(w.vintage||''))+'.jpg';
            return `<tr><td><div style="width:38px;height:48px;border-radius:6px;overflow:hidden;background:var(--card-2);display:flex;align-items:center;justify-content:center;color:var(--muted)">${src?`<img src="${src}" style="width:100%;height:100%;object-fit:cover" alt="">`:ic('image',16)}</div></td>
            <td><div class="wine-nm">${esc(w.name)}</div><div class="wine-meta">${w.variety} · ${w.vintage}</div></td>
            <td class="mono" style="font-size:12px;color:var(--muted)">${fn}</td>
            <td class="r" style="white-space:nowrap;vertical-align:middle"><div style="display:inline-flex;gap:6px;align-items:center;justify-content:flex-end"><button class="btn sm" data-up="${w.id}">${src?'Replace':'Upload'}</button>${src?`<button class="btn-quiet" data-rm="${w.id}" title="Remove" aria-label="Remove photo">${ic('x',15)}</button>`:''}</div></td></tr>`;
          }).join('')}</tbody></table></div></div>`;
      el.querySelectorAll('[data-up]').forEach(b=>b.addEventListener('click',()=>{ target=b.dataset.up; single.click(); }));
      el.querySelectorAll('[data-rm]').forEach(b=>b.addEventListener('click',()=>{ if(LIVE){ PStore.removeWineImage(b.dataset.rm).then(()=>{ WINES=PStore.wines; draw(); toast('Photo removed'); }); } else { delete imgs[b.dataset.rm]; save(); draw(); } }));
      const bt=el.querySelector('#bgr-toggle'); if(bt) bt.addEventListener('change',()=>{ try{ localStorage.setItem(BGR_KEY, bt.checked?'1':'0'); }catch(e){} });
    }
    draw();
  };

  // ---------- add / edit wine modal ----------
  function addWineModal(edit){
    const isEdit=!!edit;
    $('#modal').innerHTML=`
      <div class="modal-head"><h2>${isEdit?'Edit wine':'Add a bottle'}</h2><button class="btn-quiet" id="m-x" aria-label="Close">${ic('x',18)}</button></div>
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
        <div class="field"><label>Tasting notes <span style="color:var(--muted);font-weight:400">(max 25 words)</span></label><textarea id="f-notes" rows="2" style="width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:8px;background:var(--card-2);font-family:var(--sans);font-size:14px;color:var(--ink);resize:vertical" placeholder="Cherry, plum and soft spice…"></textarea><div style="font-size:11.5px;color:var(--muted);margin-top:6px">${ic('sparkle',12,'var(--claret)')} AIWine's sommelier writes the “why you'll like it” line for each wine automatically — you don't need to.</div></div>
        <div class="field"><label>Food pairings <span style="color:var(--muted);font-weight:400">(semicolon ;)</span></label><input id="f-pair" placeholder="roast duck; salmon; mushroom risotto"></div>
        <div class="field"><label>Awards <span style="color:var(--muted);font-weight:400">(semicolon ;)</span></label><input id="f-awards" placeholder="Gold · NZ IWS 2025"></div>
      </div>
      <div class="modal-foot"><button class="btn" id="m-cancel">Cancel</button><button class="btn primary" id="m-save">${isEdit?ic('check',15)+' Save changes':ic('plus',15)+' Add to my range'}</button></div>`;
    openModal();
    if(isEdit){
      $('#f-name').value=edit.name||''; $('#f-var').value=edit.variety||''; $('#f-colour').value=edit.colour||'Red';
      $('#f-vin').value=edit.vintage||''; $('#f-price').value=edit.price||0; $('#f-qty').value=edit.qty||0;
      if(edit.style) $('#f-style').value=edit.style; $('#f-organic').value=edit.organic?'Y':'N';
      if(edit.region) $('#f-region').value=edit.region; $('#f-sub').value=edit.subRegion||'';
      $('#f-notes').value=edit.notes||''; $('#f-pair').value=(edit.pairings||[]).join('; '); $('#f-awards').value=Array.isArray(edit.awards)?edit.awards.join('; '):(edit.awards||'');
    }
    $('#m-x').onclick=closeModal; $('#m-cancel').onclick=closeModal;
    $('#m-save').onclick=()=>{
      const name=$('#f-name').value.trim(); if(!name){ toast('Give the wine a name'); return; }
      const pairs=($('#f-pair').value||'').split(';').map(s=>s.trim()).filter(Boolean).slice(0,6);
      const notes=($('#f-notes').value||'').trim().split(/\s+/).filter(Boolean).slice(0,25).join(' ');
      const fields={ name, variety:$('#f-var').value, colour:$('#f-colour').value, style:$('#f-style').value, organic:$('#f-organic').value==='Y', region:$('#f-region').value, subRegion:$('#f-sub').value.trim(), notes, pairings:pairs, awards:($('#f-awards').value||'').trim(), vintage:+$('#f-vin').value||2024, price:+$('#f-price').value||0, qty:+$('#f-qty').value||0 };
      if(isEdit){ const btn=$('#m-save'); btn.disabled=true; Promise.resolve(PStore.updateWine(edit.id, fields)).then(()=>{ WINES=PStore.wines; closeModal(); go('wines'); toast('Saved · '+name+' updated across AIWine'); }).catch(e=>{ btn.disabled=false; toast('Couldn’t save: '+(e&&e.message||e)); }); }
      else { Promise.resolve(PStore.addWine(Object.assign({ id:Date.now(), scans:0 }, fields))).then(()=>{ WINES=PStore.wines; closeModal(); go('wines'); toast('Added · '+name+' is live on AIWine 🍷'); }).catch(e=>{ toast('Couldn’t add: '+(e&&e.message||e)); }); }
    };
  }
  // Associate every .field's <label> with its control (input/select/textarea) via
  // for/id, and give any placeholder-only control an aria-label from its label or
  // placeholder — so nothing relies on a placeholder that vanishes on focus.
  let _lfSeq=0;
  function linkFields(root){
    (root||document).querySelectorAll('.field').forEach(f=>{
      const label=f.querySelector('label'); const ctrl=f.querySelector('input,select,textarea');
      if(!ctrl) return;
      if(!ctrl.id) ctrl.id='fld-'+(++_lfSeq);
      if(label){ if(!label.htmlFor) label.htmlFor=ctrl.id; if(!ctrl.getAttribute('aria-label')) ctrl.setAttribute('aria-label', label.textContent.trim()); }
      else if(!ctrl.getAttribute('aria-label') && ctrl.placeholder) ctrl.setAttribute('aria-label', ctrl.placeholder);
    });
  }
  function openModal(){ _modalLastFocus=document.activeElement; $('#scrim').classList.add('open'); const m=$('#modal'); m.classList.add('open'); m.setAttribute('role','dialog'); m.setAttribute('aria-modal','true'); linkFields(m); document.addEventListener('keydown',_modalKeydown); setTimeout(()=>{ const f=_modalFocusables(); (f[0]||m).focus(); },40); }
  function closeModal(){ $('#scrim').classList.remove('open'); const m=$('#modal'); m.classList.remove('open'); document.removeEventListener('keydown',_modalKeydown); if(_modalLastFocus&&document.contains(_modalLastFocus)){ try{ _modalLastFocus.focus(); }catch(e){} } _modalLastFocus=null; }
  let _modalLastFocus=null;
  function _modalFocusables(){ const m=$('#modal'); if(!m) return []; if(!m.hasAttribute('tabindex')) m.setAttribute('tabindex','-1'); return Array.from(m.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(el=>el.offsetParent!==null); }
  function _modalKeydown(e){ if(e.key==='Escape'){ e.preventDefault(); closeModal(); return; } if(e.key!=='Tab') return; const f=_modalFocusables(); if(!f.length) return; const first=f[0],last=f[f.length-1],a=document.activeElement; const m=$('#modal'); if(!m.contains(a)){ e.preventDefault(); (e.shiftKey?last:first).focus(); return; } if(e.shiftKey&&a===first){ e.preventDefault(); last.focus(); } else if(!e.shiftKey&&a===last){ e.preventDefault(); first.focus(); } }

  // ---------- add ANOTHER winery (multi-winery logins, e.g. wine groups) ----------
  function addWineryModal(){
    $('#modal').innerHTML=`
      <div class="modal-head"><h2>Add another winery</h2><button class="btn-quiet" id="m-x" aria-label="Close">${ic('x',18)}</button></div>
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
  // After any auth screen renders, associate its field labels too.
  { const _app=document.getElementById('app'); if(_app){ new MutationObserver(()=>linkFields(_app)).observe(_app,{childList:true}); } }
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

  // show/hide password toggle — wires a button to flip an input between password/text
  function pwToggle(btnId, inputId){
    const b=document.getElementById(btnId), i=document.getElementById(inputId);
    if(!b||!i) return;
    b.addEventListener('click', ()=>{ const show=i.type==='password'; i.type=show?'text':'password'; b.textContent=show?'Hide':'Show'; i.focus(); });
  }
  // ---- password policy (shared) ----
  // Minimum 8 characters AND either a letter+number mix or length >= 12.
  const PW_MIN = 8;
  function pwValid(pw){ pw=pw||''; return pw.length>=PW_MIN && ((/[A-Za-z]/.test(pw)&&/\d/.test(pw)) || pw.length>=12); }
  function pwStrength(pw){ pw=pw||''; let s=0; if(pw.length>=PW_MIN)s++; if(pw.length>=12)s++; if(/[a-z]/.test(pw)&&/[A-Z]/.test(pw))s++; if(/\d/.test(pw))s++; if(/[^A-Za-z0-9]/.test(pw))s++; return Math.min(s,4); }
  const PW_RULE_MSG = 'Use at least 8 characters, with letters and a number (or 12+ characters).';
  // Live strength meter markup + wiring. Call pwMeterHtml(id) in the form, then
  // wirePwMeter(inputId, meterId) after render.
  function pwMeterHtml(meterId){
    return `<div id="${meterId}" class="pw-meter" aria-live="polite"><div class="pw-bar"><i></i></div><div class="pw-lab">${PW_RULE_MSG}</div></div>`;
  }
  function wirePwMeter(inputId, meterId){
    const i=document.getElementById(inputId), m=document.getElementById(meterId);
    if(!i||!m) return;
    const bar=m.querySelector('.pw-bar>i'), lab=m.querySelector('.pw-lab');
    const labels=['Too short','Weak','Fair','Good','Strong'];
    const colors=['#b23b3b','#c9772e','#c9a227','#6f9e57','#3f8f4f'];
    const upd=()=>{ const pw=i.value; const s=pwStrength(pw); const ok=pwValid(pw);
      bar.style.width=(pw?Math.max(12,(s/4)*100):0)+'%'; bar.style.background=colors[s];
      lab.textContent = pw ? (ok? labels[s]+' password' : PW_RULE_MSG) : PW_RULE_MSG;
      lab.style.color = pw && !ok ? '#b23b3b' : 'var(--muted)';
    };
    i.addEventListener('input', upd); upd();
  }

  const REGION_OPTS=['Wairarapa','Martinborough','Marlborough','Central Otago','Hawke’s Bay','Nelson','Auckland','Gisborne','Waikato & Bay of Plenty','North Canterbury','Waitaki Valley','Northland','Other'];
  const regionSelect=(id,sel)=>`<select id="${id}"><option value="">Select region…</option>${REGION_OPTS.map(r=>`<option${sel===r?' selected':''}>${r}</option>`).join('')}</select>`;

  function renderLogin(err){
    document.getElementById('app').innerHTML = authShell(`
        <form id="lf" style="${cardStyle}">
          ${authHead('Winery sign in')}
          <div class="field" style="margin-bottom:12px"><label>Email</label><input id="le" type="email" autofocus></div>
          <div class="field" style="margin-bottom:14px"><label>Password</label>
            <div style="position:relative"><input id="lp" type="password" style="width:100%;padding-right:64px">
            <button type="button" id="lp-t" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--claret);font-weight:600;padding:4px 6px">Show</button></div>
          </div>
          ${errRow(err)}
          <button class="btn primary" type="submit" style="width:100%;justify-content:center">Sign in</button>
          <div style="text-align:center;font-size:12.5px;margin-top:12px"><a href="#" id="l-forgot" style="color:var(--muted)">Forgot password?</a></div>
          <div style="text-align:center;font-size:12.5px;color:var(--ink-soft);margin-top:12px">New to AIWine? <a href="#" id="to-signup" style="color:var(--claret);font-weight:600">Create your winery account</a></div>
        </form>`);
    pwToggle('lp-t','lp');
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
    const fg=document.getElementById('l-forgot');
    if(fg) fg.addEventListener('click', e=>{ e.preventDefault(); renderReset(document.getElementById('le').value); });
  }

  function renderReset(prefill, err){
    document.getElementById('app').innerHTML = authShell(`
        <form id="rf" style="${cardStyle}">
          ${authHead('Reset password')}
          <div style="font-size:12.5px;color:var(--ink-soft);margin:-6px 0 16px;line-height:1.5">Enter your winery login email and we’ll send a link to set a new password.</div>
          <div class="field" style="margin-bottom:14px"><label>Email</label><input id="re" type="email" value="${esc(prefill||'')}" autofocus></div>
          ${err?`<div style="color:var(--red);font-size:12.5px;margin-bottom:12px">${esc(err)}</div>`:''}
          <button class="btn primary" type="submit" style="width:100%;justify-content:center">Send reset link</button>
          <div style="text-align:center;font-size:12.5px;margin-top:16px"><a href="#" id="r-back" style="color:var(--claret);font-weight:600">Back to sign in</a></div>
        </form>`);
    document.getElementById('r-back').addEventListener('click', e=>{ e.preventDefault(); renderLogin(); });
    document.getElementById('rf').addEventListener('submit', async e=>{
      e.preventDefault();
      const email=document.getElementById('re').value;
      const btn=e.target.querySelector('button[type=submit]'); btn.disabled=true; btn.textContent='Sending…';
      try {
        await PStore.resetPassword(email);
        document.getElementById('app').innerHTML = authShell(`
        <div style="${cardStyle};text-align:center">
          ${authHead('Check your inbox')}
          <div style="font-size:13.5px;color:var(--ink-soft);line-height:1.6;margin-bottom:18px">If a winery account exists for <b>${esc(email)}</b>, we’ve sent a link to set a new password. Open it on this device to continue.</div>
          <button class="btn primary" id="rb2" style="width:100%;justify-content:center">Back to sign in</button>
        </div>`);
        document.getElementById('rb2').addEventListener('click', ()=>renderLogin());
      } catch(ex){ renderReset(email, friendly(ex.message)); }
    });
  }

  function renderRecovery(err){
    document.getElementById('app').innerHTML = authShell(`
        <form id="cf" style="${cardStyle}">
          ${authHead('Set a new password')}
          <div style="font-size:12.5px;color:var(--ink-soft);margin:-6px 0 16px;line-height:1.5">Choose a new password for your winery login. ${PW_RULE_MSG}</div>
          <div class="field" style="margin-bottom:8px"><label>New password</label>
            <div style="position:relative"><input id="cp" type="password" style="width:100%;padding-right:64px" autofocus>
            <button type="button" id="cp-t" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--claret);font-weight:700">Show</button></div>
          </div>
          ${pwMeterHtml('cp-meter')}
          ${err?`<div style="color:var(--red);font-size:12.5px;margin-bottom:12px">${esc(err)}</div>`:''}
          <button class="btn primary" type="submit" style="width:100%;justify-content:center">Save new password</button>
        </form>`);
    pwToggle('cp-t','cp'); wirePwMeter('cp','cp-meter');
    document.getElementById('cf').addEventListener('submit', async e=>{
      e.preventDefault();
      const btn=e.target.querySelector('button[type=submit]');
      if(!pwValid(document.getElementById('cp').value)) return renderRecovery(PW_RULE_MSG);
      btn.disabled=true; btn.textContent='Saving…';
      try {
        await PStore.setNewPassword(document.getElementById('cp').value);
        // the winery-setup form, which looks like the reset misfired). Show a
        // clear confirmation and send them to sign in with the new password.
        await PStore.signOut();
        document.getElementById('app').innerHTML = authShell(`
          <div style="${cardStyle};text-align:center">
            ${authHead('Password updated')}
            <div style="font-size:13.5px;color:var(--ink-soft);line-height:1.6;margin-bottom:18px">Your password has been changed. Please sign in with your new password.</div>
            <button class="btn primary" id="pu-in" style="width:100%;justify-content:center">Go to sign in</button>
          </div>`);
        document.getElementById('pu-in').addEventListener('click', ()=>renderLogin());
      }
      catch(ex){ renderRecovery(friendly(ex.message)); }
    });
  }

  function renderSignup(err){
    document.getElementById('app').innerHTML = authShell(`
        <form id="sf" style="${cardStyle}">
          ${authHead('Create your winery account')}
          <div style="font-size:12.5px;color:var(--ink-soft);margin:-6px 0 16px;line-height:1.5">Tell us about your winery. We’ll review it (usually within a business day) and email you the moment your portal is ready.</div>
          <div class="field" style="margin-bottom:12px"><label>Your email</label><input id="se" type="email" autofocus></div>
          <div class="field" style="margin-bottom:8px"><label>Password</label>
            <div style="position:relative"><input id="sp" type="password" style="width:100%;padding-right:64px">
            <button type="button" id="sp-t" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--claret);font-weight:600;padding:4px 6px">Show</button></div>
          </div>
          ${pwMeterHtml('sp-meter')}
          <div class="field" style="margin-bottom:12px"><label>Winery name</label><input id="sn" placeholder="e.g. Ata Rangi"></div>
          <div class="field" style="margin-bottom:12px"><label>Region</label>${regionSelect('sr')}</div>
          <div class="field" style="margin-bottom:12px"><label>Website <span style="color:var(--muted);font-weight:400">(optional)</span></label><input id="sw" placeholder="atarangi.co.nz"></div>
          <div class="field" style="margin-bottom:14px"><label>Your name <span style="color:var(--muted);font-weight:400">(optional)</span></label><input id="scn" placeholder="Contact name"></div>
          ${errRow(err)}
          <button class="btn primary" type="submit" style="width:100%;justify-content:center">Create account</button>
          <div style="text-align:center;font-size:12.5px;color:var(--ink-soft);margin-top:16px">Already have an account? <a href="#" id="to-login" style="color:var(--claret);font-weight:600">Sign in</a></div>
        </form>`);
    document.getElementById('to-login').addEventListener('click', e=>{ e.preventDefault(); renderLogin(); });
    pwToggle('sp-t','sp'); wirePwMeter('sp','sp-meter');
    document.getElementById('sf').addEventListener('submit', async e=>{
      e.preventDefault();
      const email=document.getElementById('se').value.trim();
      const pw=document.getElementById('sp').value;
      const details={ name:document.getElementById('sn').value.trim(), region:document.getElementById('sr').value, website:document.getElementById('sw').value.trim(), contact:document.getElementById('scn').value.trim() };
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return renderSignup('Please enter a valid email address.');
      if(!pwValid(pw)) return renderSignup(PW_RULE_MSG);
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
    if(/different from the old|should be different/i.test(m)) return 'Your new password must be different from your current password.';
    if(/password/i.test(m)) return PW_RULE_MSG;
    return m;
  }

  // ---------- boot ----------
  async function boot(){
    // Arrived from a password-reset email — set the new password before anything else.
    if (PStore.isRecovery && PStore.isRecovery()) {
      try { await PStore.init(); } catch(e) {}
      renderRecovery(); return;
    }
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

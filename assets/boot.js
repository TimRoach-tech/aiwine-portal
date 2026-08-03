/* AIWine boot — SINGLE SOURCE OF TRUTH for the asset cache version.
   --------------------------------------------------------------------
   Every page loads this file FIRST (with a Date.now() bust, so it is always
   fetched fresh — it's tiny), then loads all real CSS/JS via loadAssets(),
   which appends ?v=AIWINE_V. Those big files stay cached until the version
   changes.

   ➜ TO DEPLOY A CHANGE TO ANYTHING IN assets/: bump AIWINE_V below (one
     line, one file) and upload. Every visitor gets the new files on their
     next normal page load. Never hardcode ?v= stamps in page HTML.

   PERF (20260802f): boot.js now, as its very first act, injects the Google
   Fonts <link> (with preconnect) + a small inline CRITICAL stylesheet
   (tokens + base + nav). Previously the fonts were pulled by an @import at
   the TOP of styles.css — which meant the browser had to download AND parse
   the whole stylesheet before it even discovered the fonts, then fetch them
   (a serial chain that directly delayed LCP). Now the fonts download in
   PARALLEL from the first moment, and the inline critical CSS means the page
   has correct tokens/typography/nav even before styles.css lands (and stays
   presentable if the styles.css request is ever blocked on a data-saver
   mobile connection). styles.css itself is still loaded blocking, on purpose,
   so the existing anti-flash reveal (af-hide/af-ready) is unchanged. */

(function () {
  window.AIWINE_V = '20260802t';

  window.asset = function (path) {
    return path + '?v=' + window.AIWINE_V;
  };

  /* ---- 1. FONTS: preconnect + load in parallel (was an @import in styles.css) ----
     display=swap so text paints immediately in a fallback and swaps — never blocks. */
  document.write(
    '<link rel="preconnect" href="https://fonts.googleapis.com">' +
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Manrope:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap">'
  );

  /* ---- 2. CRITICAL CSS: tokens + base + nav, inline so first paint is styled ----
     Kept deliberately small; the full styles.css (loaded next, non-blocking) overrides it.
     This is a subset of styles.css — if you change these tokens/nav there, mirror here. */
  document.write('<style id="aw-critical">' +
    ':root{--bg:#F4EFE5;--bg-alt:#EDE6D8;--card:#FAF6EE;--ink:#1B1410;--ink-soft:#4A3D34;--muted:#8B7E6E;--line:#D8CFBE;--claret:#5C1B27;--claret-deep:#3A0E18;--brass:#A98654;--brass-soft:#C9A878;--muted-ink:#6B5F52;--brass-ink:#7A5E2E;--t-display:clamp(48px,7vw,96px);--t-h1:clamp(40px,5vw,64px);--t-h2:clamp(28px,3vw,40px);--t-h3:clamp(20px,2vw,24px);--t-body:17px;--t-small:14px;--t-tiny:11px;--pad-x:clamp(24px,5vw,80px);--pad-y:clamp(56px,8vw,120px)}' +
    '*{box-sizing:border-box;margin:0;padding:0}' +
    'html,body{background:var(--bg);color:var(--ink);font-family:"Manrope",system-ui,sans-serif;font-size:var(--t-body);line-height:1.55;-webkit-font-smoothing:antialiased}' +
    'body{min-height:100vh;overflow-x:hidden}' +
    'img,svg{display:block;max-width:100%}a{color:inherit;text-decoration:none}' +
    'button{font:inherit;color:inherit;cursor:pointer;background:none;border:none}' +
    '.serif{font-family:"Cormorant Garamond",Georgia,serif;font-weight:400}.mono{font-family:"JetBrains Mono",ui-monospace,monospace}' +
    '.nav{position:sticky;top:0;z-index:90;display:flex;align-items:baseline;justify-content:space-between;padding:22px var(--pad-x) 18px;background:rgba(244,239,229,.85);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}' +
    '.nav-logo{display:flex;align-items:baseline;gap:8px;font-family:"Cormorant Garamond",serif;font-size:28px;font-weight:500;letter-spacing:-.01em}' +
    '.nav-links{display:flex;gap:32px;align-items:baseline}.nav-actions{display:flex;gap:12px;align-items:baseline}' +
    '.btn{display:inline-flex;align-items:center;gap:10px;padding:12px 22px;border:1px solid var(--ink);border-radius:999px;font-size:13px;font-weight:600;letter-spacing:.04em;background:transparent;white-space:nowrap}' +
    '.btn-primary{background:var(--claret);color:var(--bg);border-color:var(--claret)}' +
    'html.aw-css-pending{visibility:hidden!important}' +
    '</style>');

  /* ---- 3. NON-BLOCKING styles.css, reveal-safe ----
     styles.css is now loaded async (media=print → swap to all on load) via a
     DOM <link> (appendChild) — NOT document.write — so it is immune to the same
     mobile data-saver intervention that used to blank the page. To avoid a flash
     of un-styled content, we add a SECOND hide gate (aw-css-pending) that clears
     only when styles.css has actually loaded. The page therefore reveals when the
     existing anti-flash gate (.af-ready, on DOMContentLoaded) AND styles.css-loaded
     are BOTH true. A 3s failsafe clears the gate no matter what, so a blocked/
     missing stylesheet can never leave the page hidden forever. */
  document.documentElement.classList.add('aw-css-pending');
  setTimeout(function () { document.documentElement.classList.remove('aw-css-pending'); }, 3000);

  // loadAssets('assets/styles.css', 'assets/app.js', …) — order preserved.
  // Scripts are written with DEFER: non-parser-blocking (big LCP win on mobile),
  // but still execute in document order and BEFORE DOMContentLoaded — so shared
  // scripts (partials.js) and every page's DOMContentLoaded handler still fire
  // exactly as before. Defer also means these are NOT the parser-blocking
  // document.write() scripts that Chrome's data-saver intervention blocks, which
  // was the root cause of the old mobile "just the background" bug.
  window.loadAssets = function () {
    window.__awAssets = window.__awAssets || [];
    for (var i = 0; i < arguments.length; i++) {
      var p = arguments[i], u = window.asset(p);
      if (/\.css(?:$|\?)/i.test(p)) {
        // Non-blocking stylesheet via DOM injection (not document.write). media=print
        // means it doesn't block render; onload swaps it live to all. The MAIN
        // styles.css additionally clears the reveal gate once it has applied.
        var isMain = /styles\.css(?:$|\?)/i.test(p);
        var l = document.createElement('link');
        l.rel = 'stylesheet'; l.href = u; l.media = 'print';
        l.onload = (function (main) { return function () { this.media = 'all'; if (main) document.documentElement.classList.remove('aw-css-pending'); }; })(isMain);
        l.onerror = (function (main) { return function () { if (main) document.documentElement.classList.remove('aw-css-pending'); }; })(isMain);
        document.head.appendChild(l);
      } else {
        var idx = window.__awAssets.length; window.__awAssets.push(u);
        document.write('<script defer src="' + u + '" onload="window.__awOK=window.__awOK||{};window.__awOK[' + idx + ']=1"><\/script>');
      }
    }
  };

  // Mobile safety net: some mobile browsers (Chrome data-saver / slow
  // connections) BLOCK document.write()-injected external scripts, leaving a
  // styled page with no data (“just the background”). Any script that never
  // fired onload is re-fetched via appendChild (fills the HTTP cache, which is
  // exempt from the intervention), then the page reloads ONCE so everything
  // runs in the original order.
  window.addEventListener('load', function () {
    setTimeout(function () {
      var ok = window.__awOK || {}, list = window.__awAssets || [], missing = [];
      for (var i = 0; i < list.length; i++) if (!ok[i]) missing.push(list[i]);
      if (!missing.length) return;
      try { if (sessionStorage.getItem('aiwine:dw-retry')) return; sessionStorage.setItem('aiwine:dw-retry', '1'); } catch (e) { return; }
      var left = missing.length;
      for (var j = 0; j < missing.length; j++) (function (u) {
        var s = document.createElement('script'); s.src = u; s.async = false;
        s.onload = s.onerror = function () { if (--left === 0) location.reload(); };
        document.head.appendChild(s);
      })(missing[j]);
    }, 1500);
  });
})();

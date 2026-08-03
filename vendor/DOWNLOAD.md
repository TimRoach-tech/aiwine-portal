# portal/vendor/ — self-hosted third-party libraries

The portal loads two third-party libraries. To remove all dependence on a public
CDN (supply-chain hardening), download them ONCE into this folder. The code loads
`vendor/<file>` first and only falls back to a **version-pinned** CDN if the local
copy is missing — so the portal keeps working either way, but with the files here
it never trusts an external CDN at runtime.

Download (do this on your machine, then commit the two files):

    # from the portal/ folder
    mkdir -p vendor
    curl -L -o vendor/xlsx.full.min.js   https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js
    curl -L -o vendor/supabase.min.js    https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js

Pinned versions (must match the CDN fallbacks in the code):
  • SheetJS  xlsx            0.18.5   — loaded by portal.js  (loadXlsx)
  • supabase-js              2.45.4   — loaded by store.js   (loadLib)
    (was the floating "@2" — now pinned so a new major/minor can't ship silently.)

When you upgrade a version later: change it in BOTH the CDN fallback URL (in the
code) AND re-download the file here, keeping the two in lockstep.

These are large minified vendor files — no need to read them; they're loaded as-is.

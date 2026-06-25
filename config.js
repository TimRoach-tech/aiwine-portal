/* AIWine Winery Portal — configuration.
   DEMO MODE (default): leave SUPABASE_URL empty → runs on sample data in the
   browser. LIVE MODE: paste the SAME Supabase project URL + anon key the CRM
   uses (Project Settings → API), redeploy, and each winery login sees only its
   own wines & orders (enforced by the RLS in supabase/01-portal-schema.sql). */
window.PORTAL_CONFIG = {
  SUPABASE_URL: "https://rabysewpavsakveuufjr.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_w5jYkD5E4FdH-h1VRdx6hg_2_2kgoNv",
  APP_NAME: "AIWine Winery Portal",
  // Absolute URL to the winery app. The portal and the app are often on
  // different hosts, so set this to the app's live address. Falls back to the
  // relative path when left empty (only works if they share a host).
  WINERY_APP_URL: "https://aiwine.co.nz/apps/winery/index.html",
};

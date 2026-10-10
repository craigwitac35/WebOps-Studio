/* ============================================================
   Workshop demo 05 (Quote Form to Dashboard): Supabase settings.

   Leave both blank and the demo runs in offline mode (fully working,
   rows kept in the visitor's tab).

   To go live:
   1. Run supabase/workshop-demo.sql in your Supabase project's SQL editor.
   2. Supabase dashboard > Authentication > Sign In / Providers:
      turn ON "Allow anonymous sign-ins".
   3. Paste your Project URL and anon (public) key below, then push.

   The anon key is designed to be public. Row level security in the
   SQL file is what keeps each visitor locked to their own rows.
   ============================================================ */
window.WEBOPS_SUPABASE = {
  url: '',      // e.g. 'https://abcdefghijklmno.supabase.co'
  anonKey: ''   // the long "anon public" key from Project Settings > API
};

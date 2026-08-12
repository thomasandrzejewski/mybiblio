---
name: Supabase setup

1) Create a Supabase project at https://app.supabase.com
2) Open the SQL Editor and run db-schema.sql to create the tables (shelves, books).
3) In the Project Settings → API, copy the Project URL and anon public key.
4) Create a file in the repo root called supabase-config.js (do NOT commit secrets):

   // supabase-config.js
   window.SUPABASE_URL = 'https://your-project-ref.supabase.co';
   window.SUPABASE_ANON_KEY = 'your-anon-key-here';

5) Include that file in your HTML pages BEFORE the module scripts, for example in index.html <head>:

   <script src="supabase-config.js"></script>

6) The app will automatically use Supabase when those variables are present; otherwise it falls back to localStorage.

Notes:
- This approach uses the public anon key from Supabase client. For production, configure Row Level Security (RLS) policies appropriately.
- If you want the DB to be shared (public), ensure policies allow public read/write, or configure auth for restricted writes.
---

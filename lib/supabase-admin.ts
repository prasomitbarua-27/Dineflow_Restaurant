import { createClient } from "@supabase/supabase-js";

// This client uses the SERVICE ROLE key, which bypasses Row Level
// Security and has full access to the project — it must NEVER be
// imported into any file that could end up in client-side JavaScript.
// Only import this from API routes (app/api/**/route.ts) or other
// server-only code. The env var itself has no `NEXT_PUBLIC_` prefix for
// the same reason — Next.js only exposes `NEXT_PUBLIC_*` vars to the
// browser, so this one is server-only by construction, but the naming
// alone isn't a substitute for being careful about where it's imported.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export const FOOD_IMAGES_BUCKET = "food-images";

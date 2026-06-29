import { createClient } from "@supabase/supabase-js";

// Public, read-only access to the DSA CRM dashboard data.
// The URL and publishable (anon) key are safe to expose: the `dsa` tables have
// RLS enabled with select-only policies. Values fall back to the project's own
// so the app builds and runs even when env vars aren't configured; override via
// NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.
const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://ymdkcaedwnnhszhzirli.supabase.co";

const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "sb_publishable_zEpxif_DYwn7UiBW6FP9CA_IEDSIAfN";

// All dashboard tables live in the isolated `dsa` schema.
export const supabase = createClient(url, anonKey, {
  db: { schema: "dsa" },
  auth: { persistSession: false },
});

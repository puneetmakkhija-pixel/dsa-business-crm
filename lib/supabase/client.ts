import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY, CRM_SCHEMA } from "./config";

/** Browser Supabase client (Client Components, login form, role-switcher). */
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    db: { schema: CRM_SCHEMA },
  });
}

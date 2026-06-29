import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY, CRM_SCHEMA } from "./config";

/**
 * Per-request Supabase client for Server Components, Route Handlers and Server
 * Actions. Pinned to the `crm` schema; RLS scopes every query to the logged-in
 * user automatically. Must be created per request (reads request cookies).
 */
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    db: { schema: CRM_SCHEMA },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // Server Components can't set cookies — middleware refreshes the session.
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          /* called from a Server Component — safe to ignore */
        }
      },
    },
  });
}

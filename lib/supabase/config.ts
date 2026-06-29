// Shared Supabase connection values. The publishable (anon) key is public-safe:
// the crm tables enforce RLS, so the key only ever sees what the logged-in user may.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://ymdkcaedwnnhszhzirli.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "sb_publishable_zEpxif_DYwn7UiBW6FP9CA_IEDSIAfN";

// All CRM data lives in the `crm` Postgres schema.
export const CRM_SCHEMA = "crm" as const;

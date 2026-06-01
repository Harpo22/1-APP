import { createClient } from "@supabase/supabase-js";

// Configured via environment variables (Vercel / .env):
//   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
// When absent, the app runs fully in local-only mode (no cloud account).
const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anon);

export const supabase = isSupabaseConfigured
  ? createClient(url, anon, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

// Single-document storage table. One row per user, upserted -> no duplicate records.
export const DATA_TABLE = "app_data";

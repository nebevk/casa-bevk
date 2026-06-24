/**
 * Centralized Supabase env access.
 *
 * `isSupabaseConfigured` lets the app boot and render (themed login, shell)
 * even before Supabase is connected — instead of hard-crashing on missing env.
 * Auth/data simply stay inert until NEXT_PUBLIC_SUPABASE_* are set in .env.local.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured =
  SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

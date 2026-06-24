import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/**
 * Supabase client for Client Components (browser) and realtime subscriptions.
 *
 * Once the schema is applied, generate types (`pnpm db:types`) and pass them:
 *   createBrowserClient<Database>(...)
 */
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

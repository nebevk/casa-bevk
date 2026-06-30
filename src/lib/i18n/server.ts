import "server-only";

import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/dal";
import { DEFAULT_LOCALE, isLocale, type Locale } from "./config";
import { getDictionary } from "./dictionaries";
import { translate, type TFunction } from "./translate";

/** The signed-in user's UI language (from user_settings; defaults to sl). */
export const getLocale = cache(async (): Promise<Locale> => {
  const user = await getUser();
  if (!user) return DEFAULT_LOCALE;
  // Untyped: `locale` arrives in migration 0010 (types not regen'd yet).
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const { data } = await supabase
    .from("user_settings")
    .select("locale")
    .eq("user_id", user.id)
    .maybeSingle();
  const loc = (data as { locale?: string } | null)?.locale;
  return isLocale(loc) ? loc : DEFAULT_LOCALE;
});

export async function getMessages() {
  const locale = await getLocale();
  return { locale, messages: getDictionary(locale) };
}

/** Server-side translation for server components: `const { t } = await getT()`. */
export async function getT(): Promise<{ t: TFunction; locale: Locale }> {
  const { locale, messages } = await getMessages();
  return { t: (path, vars) => translate(messages, path, vars), locale };
}

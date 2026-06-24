import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Data Access Layer (Next 16 recommended pattern).
 *
 * `getUser()` is cache()-wrapped so the JWT is verified once per request.
 * Always use getUser() (verifies with Supabase Auth) — never getSession()
 * for authorization. Postgres RLS is the final backstop.
 */
export const getUser = cache(async () => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Redirects to /login when there is no authenticated user. */
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

/** Current user's profile row (null before the schema exists or when signed out). */
export const getProfile = cache(async () => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return data ?? null;
});

/** The user's household (first membership). Null before the schema exists. */
export const getHousehold = cache(async () => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("households")
    .select("*")
    .limit(1)
    .maybeSingle();
  return data ?? null;
});

export type Member = {
  id: string;
  role: string;
  name: string;
  avatarUrl: string | null;
};

/** The household's members (the two people), with display info for pickers. */
export const getHouseholdMembers = cache(async (): Promise<Member[]> => {
  const user = await getUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("household_members")
    .select("user_id, role, profile:profiles(display_name, avatar_url)")
    .order("role", { ascending: false }); // owner first

  return (data ?? []).map((m) => {
    const profile = m.profile as {
      display_name: string | null;
      avatar_url: string | null;
    } | null;
    return {
      id: m.user_id as string,
      role: m.role as string,
      name: profile?.display_name ?? "Member",
      avatarUrl: profile?.avatar_url ?? null,
    };
  });
});

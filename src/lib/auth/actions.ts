"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type AuthState = {
  error?: string;
  message?: string;
};

function notConfigured(): AuthState {
  return {
    error:
      "Supabase isn't connected yet. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
  };
}

/** Email + password sign-in. Redirects to the dashboard on success. */
export async function signInWithPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured) return notConfigured();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  redirect("/dashboard");
}

/** Passwordless magic-link sign-in. Sends an email; does not sign in directly. */
export async function signInWithMagicLink(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured) return notConfigured();

  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email." };

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? (await headers()).get("origin") ?? "";

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // Sign-up is disabled in Supabase for this private app; only the two
      // pre-provisioned accounts can receive a link.
      shouldCreateUser: false,
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (error) return { error: error.message };

  return { message: `Check ${email} for a sign-in link.` };
}

/** Combined entry used by the login form; branches on the hidden `mode` field. */
export async function signIn(
  prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  return formData.get("mode") === "magic"
    ? signInWithMagicLink(prev, formData)
    : signInWithPassword(prev, formData);
}

/** Sign out and return to the login screen. */
export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}

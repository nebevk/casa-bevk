import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles the magic-link / PKCE redirect: exchanges the `code` for a session,
 * then forwards to the app. (Sign-up is disabled, so only the two existing
 * accounts ever reach here.)
 */
/** Only allow internal, single-slash relative paths (blocks //evil.com, /\evil.com). */
function safeNext(value: string | null): string {
  return value && /^\/(?![/\\])/.test(value) ? value : "/dashboard";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}

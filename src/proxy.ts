import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Next.js 16 Proxy (replaces `middleware.ts`). Runs on the Node.js runtime.
 * Refreshes the Supabase session cookie and does an optimistic auth redirect.
 * Real authorization also happens in the DAL (lib/auth/dal.ts) + Postgres RLS.
 */
export async function proxy(request: NextRequest) {
  // Before Supabase is connected, don't gate anything — let the app render.
  if (!isSupabaseConfigured) return NextResponse.next();
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (build assets)
     * - favicon.ico, robots.txt, sitemap.xml
     * - PWA metadata that must stay public: manifest.webmanifest, icon(.svg),
     *   apple-icon, app-icon
     * - common static asset extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|apple-icon|app-icon|icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)",
  ],
};

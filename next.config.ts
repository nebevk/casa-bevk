import type { NextConfig } from "next";

/**
 * App-wide security headers. Applied to every route.
 *
 * The CSP is intentionally conservative: it hardens framing (clickjacking),
 * `base`, and form targets, but does NOT yet restrict script/style/connect
 * sources. A full source CSP needs per-request nonces and explicit allowances
 * for Supabase REST + realtime (wss) and would risk breaking the app, so it is
 * deferred to a dedicated pass.
 */
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  // A stray lockfile exists in a parent folder; pin the workspace root so
  // Turbopack resolves this project correctly.
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

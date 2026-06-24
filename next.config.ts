import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A stray lockfile exists in a parent folder; pin the workspace root so
  // Turbopack resolves this project correctly.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;

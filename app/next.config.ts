import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Note: 'output: export' is removed to support NextAuth API routes
  // For Cloudflare Pages, use Cloudflare Workers or deploy to Vercel/other Node.js hosts
  trailingSlash: true,
};

export default nextConfig;

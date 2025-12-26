import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for Docker deployment with full SSO support
  output: 'standalone',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

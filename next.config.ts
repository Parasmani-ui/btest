import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Warning instead of error during build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

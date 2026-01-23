import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mark packages as server-only to prevent client-side bundling
  serverExternalPackages: ['pnp-sdk', '@coral-xyz/anchor'],

  // Empty turbopack config to acknowledge we're using Turbopack
  turbopack: {},

  // External image domains for market images
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'unavatar.io' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'assets.coingecko.com' },
      { protocol: 'https', hostname: 'raw.githubusercontent.com' },
      { protocol: 'https', hostname: 'www.cryptocompare.com' },
    ],
  },
};

export default nextConfig;

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextConfig } from "next";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Bundle analyzer
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

// ⚠️ Emergency build switches – flip to false after cleanup
const EMERGENCY_IGNORE = true;

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Must be TOP-LEVEL to take effect during `next build`
  eslint: { ignoreDuringBuilds: EMERGENCY_IGNORE },
  typescript: { ignoreBuildErrors: EMERGENCY_IGNORE },

  experimental: {
    optimizePackageImports: [
      "@supabase/ssr", // Changed from supabase-js
      "lucide-react",
      "react-icons", 
      "date-fns",
      "lodash",
    ],
  },

  // Moved from experimental (Next.js 15 change)
  serverExternalPackages: ["@supabase/supabase-js"],

  // Typed webpack callback using Next's bundled webpack types
  webpack: (
    config: any,
    context: {
      dev: boolean;
      isServer: boolean;
      buildId: string;
      nextRuntime?: "edge" | "nodejs";
      webpack: typeof import("next/dist/compiled/webpack/webpack");
      defaultLoaders: { babel: any };
    }
  ) => {
    const { dev, isServer } = context;

    // 🔥 CRITICAL: Exclude massive tr46 mappingTable from client bundles
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'tr46': false,
      };
    }

    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization?.splitChunks,
          chunks: "all",
          cacheGroups: {
            ...(config.optimization?.splitChunks?.cacheGroups ?? {}),
            supabase: {
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
              name: "supabase",
              priority: 30,
              reuseExistingChunk: true,
            },
            icons: {
              test: /[\\/]node_modules[\\/](lucide-react|react-icons)[\\/]/,
              name: "icons",
              priority: 25,
              reuseExistingChunk: true,
            },
            utils: {
              test: /[\\/]node_modules[\\/](date-fns|lodash)[\\/]/,
              name: "utils",
              priority: 20,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    // Prefer ESM build for better tree-shaking
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@supabase/supabase-js": "@supabase/supabase-js/dist/module/index.js",
    };

    return config;
  },

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "bfpjvyeuzboakfzkeqpv.supabase.co", pathname: "/**" },
      { protocol: "https", hostname: "cdn.suno.ai", pathname: "/**" },
      { protocol: "https", hostname: "www.udio.com", pathname: "/**" },
      { protocol: "https", hostname: "cdn.midjourney.com", pathname: "/**" },
      { protocol: "https", hostname: "cdn.dailytidbit.org", pathname: "/**" },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  trailingSlash: false,

  ...(process.env.NODE_ENV === "production" && {
    output: "standalone",
    generateEtags: false,
    poweredByHeader: false,
  }),

  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "public, s-maxage=60, stale-while-revalidate=300" }],
      },
    ];
  },

  async redirects() { return []; },
  async rewrites() { return []; },
};

export default withBundleAnalyzer(nextConfig);
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextConfig } from "next";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Bundle analyzer
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // CRITICAL FIX: Remove styledJsx disable - conflicts with Tailwind v4
  compiler: {
    // styledJsx: false, // REMOVED - this causes hydration issues with Tailwind v4
  },

  experimental: {
    optimizePackageImports: [
      "@supabase/ssr",
      "lucide-react",
      "tailwindcss",
    ],
  },

  // Moved from experimental (Next.js 15 change)
  serverExternalPackages: ["@supabase/supabase-js"],

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

    // CRITICAL: Exclude massive tr46 mappingTable from client bundles
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

  // Headers with admin route protection
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/field-guide/:path*",
        headers: [{ key: "Cache-Control", value: "public, s-maxage=600, stale-while-revalidate=3600" }],
      },
    ];
  },

  async redirects() { return []; },
  async rewrites() { return []; },
};

export default withBundleAnalyzer(nextConfig);
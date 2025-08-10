import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'bfpjvyeuzboakfzkeqpv.supabase.co', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.suno.ai', pathname: '/**' },
      { protocol: 'https', hostname: 'www.udio.com', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.midjourney.com', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.dailytidbit.org', pathname: '/**' },
    ],
  },
};

export default nextConfig;

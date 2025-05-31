import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'scontent-ams2-1.xx.fbcdn.net',
      },
    ],
  },
};

export default nextConfig;

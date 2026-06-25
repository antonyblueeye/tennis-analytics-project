import type { NextConfig } from 'next';

/** Railway/backend URL — used for rewrites on Vercel (build time). */
const backendUrl = (
  process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000'
).replace(/\/$/, '');

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

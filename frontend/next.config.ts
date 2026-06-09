import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname, // корень = папка frontend
  },
};

export default nextConfig;
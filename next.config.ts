import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  assetPrefix: process.env.NODE_ENV === "production" ? "https://duneuk-terminal.vercel.app" : undefined,
};

export default nextConfig;

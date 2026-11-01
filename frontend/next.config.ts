import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output is only needed for Docker; Vercel requires standard default output
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,
};

export default nextConfig;

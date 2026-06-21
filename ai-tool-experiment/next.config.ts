import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(),
  reactStrictMode: true
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  output: "export",
  trailingSlash: true,
  basePath: process.env.GITHUB_ACTIONS ? "/veilzero" : "",
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["argon2", "@node-rs/argon2"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
  webpack(config) {
    config.output = config.output || {};
    config.output.hashFunction = "sha256";
    if (config.optimization) {
      config.optimization.realContentHash = false;
    }
    return config;
  },
};

export default nextConfig;

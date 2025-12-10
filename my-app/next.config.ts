import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    // Ignore optional/test-only deps pulled in by wallet/pino stacks during SSR
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'desm': false,
      'fastbench': false,
      'pino-elasticsearch': false,
      'tap': false,
      '@react-native-async-storage/async-storage': false,
    };
    return config;
  },
};

export default nextConfig;

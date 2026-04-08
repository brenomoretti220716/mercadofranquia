/** @type {import('next').NextConfig} */

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig = {
  // Enable standalone output for Docker
  output: "standalone",

  // Enable React production mode
  reactStrictMode: true,

  // Optimize compiler for better tree-shaking and smaller bundles
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Webpack optimizations
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // Optimize bundle size
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        moduleIds: "deterministic",
        runtimeChunk: "single",
      };
    }

    return config;
  },

  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "162.215.10.70",
        port: "3515",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "apifranchise.mindconsulting.com.br",
        pathname: "/uploads/**",
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    formats: ["image/webp", "image/avif"],
  },

  // Performance optimizations
  experimental: {
    optimizePackageImports: [
      "@tanstack/react-query",
      "date-fns",
      "sonner",
      "zod",
    ],
  },

  // Headers for caching and compression
  async headers() {
    return [
      {
        source: "/fonts/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);

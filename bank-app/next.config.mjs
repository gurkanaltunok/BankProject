/** @type {import('next').NextConfig} */
const nextConfig = {
  // Webpack cache sorunlarını önlemek için
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Development modunda cache'i devre dışı bırak
      config.cache = false;
    }
    return config;
  },
  // Experimental özellikler
  experimental: {
    // Turbopack'i devre dışı bırak (daha stabil)
    turbo: {
      enabled: false,
    },
  },
  // TypeScript hatalarını ignore et (development sırasında)
  typescript: {
    ignoreBuildErrors: false,
  },
  // ESLint hatalarını ignore et (development sırasında)
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;

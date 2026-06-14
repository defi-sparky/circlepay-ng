/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  turbopack: {},

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    formats: ["image/webp", "image/avif"],
  },

  webpack: (config, { dev }) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": false,
    if (!dev) {
      config.optimization.minimize = true;
    }
    return config;
  },

  async headers() {
    return [
      {
        source: "/logo.png",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/favicon.png",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;

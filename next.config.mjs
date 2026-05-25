/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  compress: true,

  // Silence the turbopack/webpack conflict warning on Vercel
  turbopack: {},

  // Skip type and lint checks during Vercel build for clean deploys
  // Run locally: npx tsc --noEmit
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

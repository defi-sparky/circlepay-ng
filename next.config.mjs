/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  compress: true,

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

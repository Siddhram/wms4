/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config, { isServer }) => {
    // Always avoid bundling undici
    config.resolve.alias['undici'] = false;
    return config;
  }
};

module.exports = nextConfig;

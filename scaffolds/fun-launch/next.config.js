/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // Force dynamic pages (no prerender)
  experimental: { turbopack: {} },
  output: "standalone",

  // Prevent static optimization
  trailingSlash: false,
};

module.exports = nextConfig;

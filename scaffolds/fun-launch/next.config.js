/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ✅ Skip lint errors during CI builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ✅ Still check TypeScript errors
    ignoreBuildErrors: false,
  },
  reactStrictMode: true
  // ❌ Removed swcMinify (deprecated in Next.js 15+)
};

module.exports = nextConfig;

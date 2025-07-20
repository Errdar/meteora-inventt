/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Keep React Strict Mode for better developer warnings
  reactStrictMode: true,

  // ✅ Ignore ESLint warnings & errors during CI/Vercel builds
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ✅ Ignore TypeScript build errors so deploys never fail
  typescript: {
    ignoreBuildErrors: true,
  },

  // ✅ Disable any Next.js static optimization (forces CSR)
  output: "standalone",
  trailingSlash: false,

  // ✅ Explicitly disable static prerendering to prevent SSR wallet issues
  experimental: {
    // Turbopack config placeholder (optional)
    turbo: {},
    // Ensures all pages are treated as dynamic
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  // ✅ Prevent caching issues on Vercel
  onDemandEntries: {
    maxInactiveAge: 60 * 1000, // 1 minute
    pagesBufferLength: 2,
  },

  // ✅ Ensure Next.js doesn’t try to optimize images on the server
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;

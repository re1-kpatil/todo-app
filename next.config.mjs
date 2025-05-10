/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

// next.config.mjs (for Next.js 13 or later)
export default {
  experimental: {
    outputStandalone: true,  // Optional: Helps for standalone static export
  },
  output: 'export',  // Static Export
  trailingSlash: true,
};


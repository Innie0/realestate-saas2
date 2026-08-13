/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep googleapis out of the Turbopack/webpack server bundle — avoids Vercel build failures.
  serverExternalPackages: ['googleapis'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'api.mapbox.com',
        pathname: '/styles/**',
      },
    ],
  },
};

module.exports = nextConfig;

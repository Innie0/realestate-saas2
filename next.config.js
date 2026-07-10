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
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

module.exports = nextConfig;

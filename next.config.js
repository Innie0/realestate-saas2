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

const { withSentryConfig } = require('@sentry/nextjs/config');

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  telemetry: false,
  // No auth token yet, so source maps aren't uploaded; errors still report.
  sourcemaps: { disable: true },
});

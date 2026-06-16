/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'], // For Google profile images
  },
  transpilePackages: ['@react-pdf/renderer'],
}

module.exports = nextConfig


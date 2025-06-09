/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // se remueve appDir: true porque ya no es necesario en Next.js 14
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
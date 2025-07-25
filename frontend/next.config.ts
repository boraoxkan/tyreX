/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:8000/api/v1',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_BASE_URL || 'http://localhost:8000/api/v1'}/:path*`,
      },
    ];
  },
  // Tailwind CSS için
  experimental: {
    optimizeCss: true,
  },
}

module.exports = nextConfig
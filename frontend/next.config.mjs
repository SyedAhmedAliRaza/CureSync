/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Local dev hits localhost:8000; production uses NEXT_PUBLIC_API_URL
    // set in the Vercel dashboard (e.g. https://curesync-api.onrender.com)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

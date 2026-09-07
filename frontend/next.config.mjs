/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Local dev hits localhost:8000; production uses API_URL (or
    // NEXT_PUBLIC_API_URL) set in the Vercel dashboard
    // (e.g. https://curesync-api.onrender.com). No public prefix needed —
    // this config runs server-side at build time, never in the browser.
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
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

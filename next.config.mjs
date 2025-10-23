/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  experimental: { serverActions: { bodySizeLimit: '15mb' } }
};

export default nextConfig;

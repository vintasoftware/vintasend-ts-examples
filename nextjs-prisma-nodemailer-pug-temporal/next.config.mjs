/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    'vintasend',
    'vintasend-prisma',
    'vintasend-pug',
    'vintasend-nodemailer',
    'vintasend-winston',
  ],
};

export default nextConfig;

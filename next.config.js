/** @type {import('next').NextConfig} */
const withNextIntl = require('next-intl/plugin')(
  // This is the default, also the `src` folder is supported
  './src/i18n.ts'
);

const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = withNextIntl(nextConfig);

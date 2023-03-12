const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
module.exports = withBundleAnalyzer({
  async redirects() {
    return [
      {
        source: '/tx',
        destination: '/',
        permanent: true,
      },
    ];
  },
  experimental: {
    appDir: true,
    optimizeCss: true,
  },
});

module.exports = {
  // pino throw error during yarn build,
  // see https://github.com/WalletConnect/walletconnect-monorepo/issues/1908#issuecomment-1487801131
  webpack: (config, context) => {
    if (config.plugins) {
      config.plugins.push(
        new context.webpack.IgnorePlugin({
          resourceRegExp: /^(lokijs|pino-pretty|encoding)$/,
        }),
      );
    }
    return config;
  },
};

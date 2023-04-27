require('@offchainlabs/eslint-config-typescript/base');
require('@offchainlabs/eslint-config-typescript/next');

module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true,
  },
  ignorePatterns: ['dist', '**/*.js', 'node_modules'],
  extends: [
    '@offchainlabs/eslint-config-typescript/base',
    '@offchainlabs/eslint-config-typescript/next',
  ],
  parserOptions: {
    ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
    sourceType: 'module', // Allows for the use of imports
  },
};

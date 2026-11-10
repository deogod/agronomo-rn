// https://docs.expo.dev/guides/using-eslint/
const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  // src/api/generated will hold Orval output: generated code is not linted.
  globalIgnores(['dist/*', '.expo/*', 'src/api/generated/*']),
  expoConfig,
  prettierRecommended,
]);

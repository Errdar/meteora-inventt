module.exports = {
  root: true,
  extends: ['@meteora-invent/config-eslint'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: [
    'node_modules',
    'dist',
    'build',
    '.next',
    '.turbo',
    'coverage',
    '*.config.js',
    '*.config.ts',
    '.eslintrc.js'
  ],
};

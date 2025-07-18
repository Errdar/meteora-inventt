module.exports = {
  extends: [require.resolve('@meteora-invent/config-eslint/node.js')],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  root: true,
  ignorePatterns: ['.eslintrc.js'],
};

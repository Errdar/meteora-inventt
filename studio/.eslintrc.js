module.exports = {
  extends: [require.resolve('@meteora-invent/config-eslint/node.js')],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  root: true,
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    // allow process.exit() in SDK/demo scripts
    'no-process-exit': 'off',
    // allow unused variables with underscore prefix, and make others warnings
    '@typescript-eslint/no-unused-vars': 'off',
    // allow any types in SDK demo code
    '@typescript-eslint/no-explicit-any': 'off',
    // allow non-null assertions in SDK code
    '@typescript-eslint/no-non-null-assertion': 'off',
    // allow named imports as default (common in SDK usage)
    'import/no-named-as-default': 'off',
    // allow import order
    'import/order': 'off',
    // allow no-unused-vars
    'no-unused-vars': 'off',
  },
};

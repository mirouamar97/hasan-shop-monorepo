import baseConfig from './base.js';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...baseConfig,
  {
    rules: {
      '@typescript-eslint/no-extraneous-class': 'off',
      // Nest DI needs runtime class references via emitDecoratorMetadata.
      // Preferring type-only imports erases constructor tokens and breaks bootstrap.
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
];

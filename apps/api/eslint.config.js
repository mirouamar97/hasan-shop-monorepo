import nestjsConfig from '@hasan-shop/config-eslint/nestjs';

export default [
  ...nestjsConfig,
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
          disallowTypeAnnotations: false,
        },
      ],
    },
  },
];

import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';

const tsProjects = [
  './tsconfig.base.json',
  './layer1/tsconfig.json',
  './layer2/tsconfig.json',
  './zk/tsconfig.json',
];

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: [
      "layer1/generated-types/**",
      "layer2/generated-types/**",
      "zk/generated-types/**",
    ],
    languageOptions: {
      parser: tsParser,
      sourceType: 'module',
      parserOptions: {
        project: tsProjects,
        tsconfigRootDir: process.cwd(),
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      prettier: prettierPlugin,
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: tsProjects,
        },
      },
    },
    rules: {
      ...tseslint.configs.recommended.rules,

      // Prettier
      'prettier/prettier': 'error',

      // TS-specific
      '@typescript-eslint/no-unused-vars': 'error',
      'no-unused-vars': 'off', 
      'no-undef': 'off', 
      'prefer-const': 'error',
      
      // Import rules
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling', 'index'],
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      'import/no-unresolved': 'error',
      'import/no-absolute-path': 'error',
    },
  },
  prettierConfig, 
];

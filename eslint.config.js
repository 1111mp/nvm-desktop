import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import reactCompiler from 'eslint-plugin-react-compiler';

/** @type {import('eslint').Linter.Config[]} */
export default [
  { ignores: ['*', '!src/'] },
  {
    files: ['src/**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    settings: {
      react: {
        version: '19.0.0',
      },
    },
  },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat['jsx-runtime'],
  {
    plugins: {
      'react-compiler': reactCompiler,
    },
    rules: {
      'react-compiler/react-compiler': 'error',
    },
  },
  {
    rules: {
      'react/prop-types': 0,
      '@typescript-eslint/no-explicit-any': 0,
    },
  },
];

import js from '@eslint/js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import securityPlugin from 'eslint-plugin-security';
import noUnsanitizedPlugin from 'eslint-plugin-no-unsanitized';
import reactHooks from 'eslint-plugin-react-hooks';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const securityRules = {
  ...js.configs.recommended.rules,
  ...securityPlugin.configs.recommended.rules,
  ...noUnsanitizedPlugin.configs['recommended-legacy'].rules,
  'no-undef': 'off',
  'no-unused-vars': 'off',
  'no-empty': 'off',
};

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'test-results/**', 'playwright-report/**', 'coverage/**'],
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}', '**/*.config.ts'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
        tsconfigRootDir: projectRoot,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      security: securityPlugin,
      'no-unsanitized': noUnsanitizedPlugin,
      'react-hooks': reactHooks,
    },
    rules: securityRules,
  },
];

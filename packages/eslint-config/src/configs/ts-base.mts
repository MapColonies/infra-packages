import type { Linter } from 'eslint';
import eslint from '@eslint/js';
import { configs as tsEslintConfigs } from 'typescript-eslint';
import { flatConfigs as importFlatConfigs } from 'eslint-plugin-import-x';
import eslintConfigPrettier from 'eslint-config-prettier';
import tsParser from '@typescript-eslint/parser';
import mapColoniesPlugin from '@map-colonies/eslint-plugin';
import { defineConfig } from 'eslint/config';

/**
 * ESLint naming convention rules for TypeScript projects
 *
 * Defines naming patterns for:
 * - Default identifiers (camelCase)
 * - Variables (camelCase, UPPER_CASE, PascalCase for providers)
 * - Parameters (camelCase with optional leading underscore)
 * - Private members (camelCase)
 * - Enum members (UPPER_CASE)
 * - Types (PascalCase)
 * - Quoted properties (any format)
 */
export const namingConventions = [
  'error',
  {
    selector: 'default',
    format: ['camelCase'],
  },
  {
    selector: 'variable',
    format: ['camelCase', 'UPPER_CASE'],
  },
  {
    selector: 'variable',
    format: ['PascalCase'],
    filter: {
      regex: '^.*Provider$',
      match: true,
    },
  },
  {
    selector: 'parameter',
    format: ['camelCase'],
    leadingUnderscore: 'allow',
  },
  {
    selector: 'memberLike',
    modifiers: ['private'],
    format: ['camelCase'],
    // leadingUnderscore: 'require',
  },
  {
    selector: 'enumMember',
    format: ['UPPER_CASE'],
  },
  {
    selector: [
      'classProperty',
      'objectLiteralProperty',
      'typeProperty',
      'classMethod',
      'objectLiteralMethod',
      'typeMethod',
      'accessor',
      'enumMember',
    ],
    format: null,
    modifiers: ['requiresQuotes'],
  },
  {
    selector: 'typeLike',
    format: ['PascalCase'],
  },
] as const satisfies Linter.RuleEntry;

const typescriptEslintRules = defineConfig({
  name: 'map-colonies/typescript-eslint/rules',

  rules: {
    '@typescript-eslint/array-type': ['error', { default: 'array' }],
    '@typescript-eslint/ban-ts-comment': 'warn',
    '@typescript-eslint/ban-tslint-comment': 'error',
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/explicit-member-accessibility': 'error',
    '@typescript-eslint/member-ordering': 'warn',
    '@typescript-eslint/method-signature-style': 'error',
    '@typescript-eslint/no-empty-interface': 'off',
    curly: 'error',
    camelcase: 'off',
    'no-lonely-if': 'error',
    '@typescript-eslint/naming-convention': namingConventions,
    '@typescript-eslint/no-base-to-string': 'warn',
    '@typescript-eslint/no-confusing-non-null-assertion': 'error',
    '@typescript-eslint/no-extraneous-class': 'warn',
    // '@typescript-eslint/no-throw-literal': 'error',
    '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
    '@typescript-eslint/no-unnecessary-condition': 'error',
    '@typescript-eslint/no-unnecessary-type-arguments': 'warn',
    '@typescript-eslint/prefer-literal-enum-member': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'warn',
    '@typescript-eslint/prefer-optional-chain': 'warn',
    '@typescript-eslint/prefer-readonly': 'error',
    '@typescript-eslint/prefer-string-starts-ends-with': 'error',
    '@typescript-eslint/promise-function-async': 'error',
    '@typescript-eslint/require-array-sort-compare': 'warn',
    '@typescript-eslint/strict-boolean-expressions': 'warn',
    '@typescript-eslint/switch-exhaustiveness-check': 'error',
    '@typescript-eslint/no-magic-numbers': [
      'error',
      {
        ignoreArrayIndexes: true,
        ignore: [1, 0],
        ignoreNumericLiteralTypes: true,
      },
    ],
    '@typescript-eslint/default-param-last': 'error',
    '@typescript-eslint/no-dupe-class-members': 'error',
    '@typescript-eslint/no-unused-expressions': 'error',
    '@typescript-eslint/no-unused-vars': ['warn', { ignoreRestSiblings: true }],
    '@typescript-eslint/return-await': 'error',
  },
});

// This is not in the jest config as it only turns rules off, and needs to be applied after the other rules
const jestTurnedOffRules = defineConfig({
  name: 'map-colonies/jest/disabled-rules',
  files: ['**/*.spec.ts?(x)', '**/*.test.ts?(x)'],
  rules: {
    '@typescript-eslint/no-magic-numbers': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
  },
});

// // This is not in the react config as it only turns rules off, and needs to be applied after the other rules
const reactNamingConventions = defineConfig({
  name: 'map-colonies/react/naming-conventions',
  files: ['**/*.tsx'],
  rules: {
    '@typescript-eslint/naming-convention': [
      ...namingConventions,
      {
        selector: 'variable',
        format: ['camelCase', 'PascalCase'],
        types: ['function'],
      },
    ],
  },
});

const importRulesAndConfig = defineConfig({
  name: 'map-colonies/import-x/rules',
  files: ['**/*.ts?(x)'],
  ignores: ['eslint.config.*'],
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'import-x/order': [
      'error',
      {
        pathGroups: [
          {
            pattern: '@**',
            group: 'external',
            position: 'after',
          },
          {
            pattern: '@*/**',
            group: 'external',
            position: 'after',
          },
        ],
      },
    ],
    'import-x/first': 'error',
    'import-x/exports-last': 'error',
    'import-x/newline-after-import': 'error',
  },
});

const globalIgnoreConfig = defineConfig({
  name: 'map-colonies/global-ignore',
  ignores: ['.husky', 'coverage', 'reports', 'dist', 'node_modules', '**/*.{js,mjs,cjs}', 'helm'],
});

const parserOptions = defineConfig({
  name: 'map-colonies/parser-options',
  languageOptions: {
    parserOptions: {
      projectService: true,
      tsconfigRootDir: process.cwd(),
    },
  },
});

const combinedConfig = defineConfig(
  eslint.configs.recommended,
  tsEslintConfigs.recommendedTypeChecked,
  typescriptEslintRules,
  jestTurnedOffRules,
  reactNamingConventions,
  //@ts-expect-error it works and a known issue https://github.com/un-ts/eslint-plugin-import-x/issues/421
  importFlatConfigs.recommended,
  { name: 'import-x/typescript', ...importFlatConfigs.typescript },
  importRulesAndConfig,
  mapColoniesPlugin.configs['pino-safety'],
  globalIgnoreConfig,
  parserOptions,
  { name: 'eslint-prettier/disabled-rules', ...eslintConfigPrettier }
);

/**
 * Combined ESLint configuration for TypeScript projects
 * Includes:
 * - ESLint recommended rules
 * - TypeScript-ESLint recommended rules with type checking
 * - Custom TypeScript rules
 * - Jest-specific rule overrides
 * - React component naming conventions
 * - Import organization rules
 * - Pino logger safety rules (@map-colonies/eslint-plugin)
 * - Global ignores for build artifacts and dependencies
 * - Parser configuration
 * - Prettier integration
 *
 * @group configs
 * @example
 * import tsBaseConfig from '@map-colonies/eslint-config/ts-base';
 * import { config } from '@map-colonies/eslint-config/helpers';
 *
 * export default config(tsBaseConfig);
 */
export default combinedConfig;

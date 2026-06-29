import type jestPluginType from 'eslint-plugin-jest';
import { defineConfig } from 'eslint/config';
import { importOrThrow } from '../internal/helpers.js';

const jestPlugin = await importOrThrow<typeof jestPluginType>('eslint-plugin-jest');

const jestConfig = defineConfig([
  {
    name: 'map-colonies/jest/rules',
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    plugins: { jest: jestPlugin },
    languageOptions: {
      globals: jestPlugin.environments.globals.globals,
    },
    rules: {
      ...jestPlugin.configs.recommended.rules,
      ...jestPlugin.configs.style.rules,
    },
  },
]);

/**
 * The default export for the Jest configuration.
 * This configuration is used to set up and customize the behavior of Jest,
 * a JavaScript testing framework.
 *
 * @group configs
 * @example
 * import jestConfig from '@map-colonies/eslint-config/jest';
 * import { config } from '@map-colonies/eslint-config/helpers';
 *
 * export default config(jestConfig);
 */
export default jestConfig;

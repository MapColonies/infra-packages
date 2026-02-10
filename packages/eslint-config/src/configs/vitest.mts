import { defineConfig } from 'eslint/config';
import type vitestPluginType from '@vitest/eslint-plugin';
import { importOrThrow } from '../internal/helpers.js';

const vitestPlugin = await importOrThrow<typeof vitestPluginType>('@vitest/eslint-plugin');

const vitestConfig = defineConfig({
  name: 'map-colonies/vitest/rules',
  files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
  plugins: { vitest: vitestPlugin },
  rules: {
    ...vitestPlugin.configs.recommended.rules,
    'vitest/expect-expect': ['error', { assertFunctionNames: ['expect', 'expectTypeOf', 'expectResponseStatus'] }],
    'vitest/padding-around-after-all-blocks': 'warn',
    'vitest/prefer-expect-resolves': 'warn',
    'vitest/prefer-hooks-in-order': 'warn',
    'vitest/prefer-to-have-length': 'warn',
    'vitest/prefer-strict-boolean-matchers': 'warn',
  },
});

/**
 * The default export for the Vitest configuration.
 * This configuration is used to set up and customize the behavior of Vitest,
 * a JavaScript testing framework.
 *
 * @group configs
 * @example
 * import vitestConfig from '@map-colonies/eslint-config/vitest';
 * import { defineConfig } from 'eslint/config';
 *
 * export default defineConfig(vitestConfig);
 */
export default vitestConfig;

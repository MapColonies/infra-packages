import type reactPluginType from 'eslint-plugin-react';
import type { plugin } from 'typescript-eslint';
import type tseslint from 'typescript-eslint';
import { config } from '../helpers.mjs';
import { importOrThrow } from '../internal/helpers.js';

type PluginReactHooks = typeof plugin & { configs: { recommended: { rules: tseslint.ConfigWithExtends['rules'] } } };

const reactPlugin = await importOrThrow<typeof reactPluginType>('eslint-plugin-react');
const pluginReactHooks = await importOrThrow<PluginReactHooks>('eslint-plugin-react-hooks');
const importedGlobals = await importOrThrow<{ browser: Exclude<tseslint.ConfigArray[0]['languageOptions'], undefined>['globals'] }>('globals');

const reactRules = config(reactPlugin.configs.flat.recommended ?? {}, reactPlugin.configs.flat['jsx-runtime'] ?? {}, {
  name: 'map-colonies/react/rules',
  files: ['**/*.tsx'],
  languageOptions: {
    globals: importedGlobals.browser,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'react/boolean-prop-naming': 'error',
    'react/hook-use-state': 'error',
    'react/prop-types': 'off',
  },
});

const reactHooksRules = config({
  name: 'map-colonies/react-hooks/rules',
  files: ['**/*.tsx'],
  plugins: { 'react-hooks': pluginReactHooks },
  rules: pluginReactHooks.configs.recommended.rules,
});

/**
 * Combined React and React Hooks ESLint configuration
 *
 * Provides ESLint rules for React and React Hooks, including:
 * - React recommended rules
 * - JSX runtime configuration
 * - Browser globals
 * - React version detection
 * - Custom React rules (boolean prop naming, useState hook usage)
 * - React Hooks recommended rules
 *
 * @group configs
 * @example
 * import reactConfig from '@map-colonies/eslint-config/react';
 * import { config } from '@map-colonies/eslint-config/helpers';
 *
 * export default config(reactConfig);
 */
export default config(reactRules, reactHooksRules);

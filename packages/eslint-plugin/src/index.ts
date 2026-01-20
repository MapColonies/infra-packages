import type { Linter } from 'eslint';
import { noSwallowedArgs } from './rules/pino-safety/no-swallowed-args.js';
import { preferStandardErrorKey } from './rules/pino-safety/prefer-standard-error-key.js';

// Plugin object following ESLint's official plugin structure
const plugin = {
  meta: {
    name: '@map-colonies/eslint-plugin',
    version: '0.0.1',
  },
  rules: {
    'pino-safety-no-swallowed-args': noSwallowedArgs,
    'pino-safety-prefer-standard-error-key': preferStandardErrorKey,
  },
  configs: {} as Record<string, Linter.Config>,
};

// Assign configs after plugin definition so we can reference it
Object.assign(plugin.configs, {
  'pino-safety': [
    {
      plugins: {
        '@map-colonies': plugin,
      },
      rules: {
        '@map-colonies/pino-safety-no-swallowed-args': 'error',
        '@map-colonies/pino-safety-prefer-standard-error-key': 'warn',
      },
    },
  ] as Linter.Config,
  recommended: [
    {
      plugins: {
        '@map-colonies': plugin,
      },
      rules: {
        '@map-colonies/pino-safety-no-swallowed-args': 'error',
        '@map-colonies/pino-safety-prefer-standard-error-key': 'warn',
      },
    },
  ] as Linter.Config,
});

export default plugin;

// Named exports for convenience
export { noSwallowedArgs, preferStandardErrorKey };

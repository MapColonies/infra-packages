import type { Linter } from 'eslint';
import { noRedundantTryCatch } from './rules/express/no-redundant-try-catch.js';
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
    'express-no-redundant-try-catch': noRedundantTryCatch,
  },
  configs: {} as Record<'pino-safety' | 'express' | 'recommended', Linter.Config>,
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
  express: [
    {
      plugins: {
        '@map-colonies': plugin,
      },
      rules: {
        '@map-colonies/express-no-redundant-try-catch': 'error',
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
        '@map-colonies/express-no-redundant-try-catch': 'error',
      },
    },
  ] as Linter.Config,
});

export default plugin;

// Named exports for convenience
export { noRedundantTryCatch, noSwallowedArgs, preferStandardErrorKey };

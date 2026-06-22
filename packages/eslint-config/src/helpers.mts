import { defineConfig } from 'eslint/config';

/**
 * Utility function to make it easy to strictly type your "Flat" config file
 * @example
 * ```js
 * // @ts-check
 *
 * import { defineConfig } from '@map-colonies/eslint-config/helpers';
 * import tsBaseConfig from '@map-colonies/eslint-config/ts-base';
 *
 * export default defineConfig([tsBaseConfig]);
 * ```
 */
export { defineConfig };

/** @deprecated Use `defineConfig` instead */
export { defineConfig as config };

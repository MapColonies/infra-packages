import type { ViteUserConfig } from 'vitest/config';

/**
 * A pre-configured list of Vitest reporters to use in your `vitest.config.ts`.
 *
 * Includes `"default"` and `"html"` reporters by default.
 * When running inside a GitHub Actions environment (`GITHUB_ACTIONS` env var is set),
 * the `"github-actions"` reporter is automatically appended for richer CI output.
 *
 * @example
 * ```typescript
 * import { defineProject, mergeConfig } from 'vitest/config';
 * import { reporters } from '@map-colonies/vitest-utils';
 *
 * export default mergeConfig(
 *   sharedConfig,
 *   defineProject({ test: { reporters } })
 * );
 * ```
 * @public
 */
const reporters: Exclude<ViteUserConfig['test'], undefined>['reporters'] = ['default', 'html'];

if (process.env.GITHUB_ACTIONS !== undefined) {
  reporters.push('github-actions');
}

export { reporters };

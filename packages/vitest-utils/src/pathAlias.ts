import path from 'node:path';

/**
 * Converts a TypeScript `compilerOptions.paths` map into a Vitest-compatible alias map.
 *
 * Each path alias key (e.g. `@app/*`) is stripped of its trailing `/*` and mapped to the
 * resolved absolute path of the first entry in its value array.
 *
 * @param tsconfig - A partial tsconfig object containing `compilerOptions.paths`
 * @param rootDir - The root directory used to resolve relative path values
 * @returns A record mapping alias names to absolute filesystem paths
 *
 * @throws Error If an alias entry has an empty path array
 *
 * @example
 * ```typescript
 * // vitest.config.ts
 * import { defineProject, mergeConfig } from 'vitest/config';
 * import { getPathAlias } from '@map-colonies/vitest-utils';
 * import tsconfigJson from './tsconfig.json';
 *
 * export default mergeConfig(
 *   sharedConfig,
 *   defineProject({
 *     resolve: {
 *       alias: getPathAlias(tsconfigJson, __dirname),
 *     },
 *   })
 * );
 * ```
 * @public
 */
function getPathAlias(tsconfig: { compilerOptions: { paths: Record<string, string[]> } }, rootDir: string): Record<string, string> {
  return Object.fromEntries(
    // For Each Path in tsconfig.json
    Object.entries(tsconfig.compilerOptions.paths).map(([key, [value]]) => {
      if (value === undefined) {
        throw new Error(`Invalid path alias for key '${key}' in tsconfig.json, expected an array with at least one path`);
      }

      return [
        // Remove the "/*" from the key and resolve the path
        key.replace('/*', ''),
        // Remove the "/*" from the value Resolve the relative path
        path.resolve(rootDir, value.replace('/*', '')),
      ];
    })
  );
}

export { getPathAlias };

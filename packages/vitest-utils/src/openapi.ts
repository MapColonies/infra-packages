import jestOpenApi from 'jest-openapi';
import { expect } from 'vitest';

/**
 * Configures `jest-openapi` to validate responses against an OpenAPI specification.
 *
 * This function bridges `jest-openapi` (which relies on a global `expect`) with
 * Vitest's local `expect` instance, then resets the global to avoid polluting
 * other tests.
 *
 * @param path - Absolute or relative path to the OpenAPI specification file (JSON or YAML)
 *
 * @example
 * The recommended approach is to call this from a Vitest setup file so it runs once
 * before the entire suite:
 * ```typescript
 * // tests/setup.ts
 * import { setupOpenapi } from '@map-colonies/vitest-utils';
 *
 * setupOpenapi('/path/to/openapi.yaml');
 * ```
 * ```typescript
 * // vitest.config.ts
 * export default defineProject({
 *   test: {
 *     setupFiles: ['./tests/setup.ts'],
 *   },
 * });
 * ```
 *
 * Alternatively, call it inside a `beforeAll` when you need per-suite control:
 * ```typescript
 * beforeAll(function () {
 *   setupOpenapi('/path/to/openapi.yaml');
 * });
 *
 * it('should satisfy the OpenAPI spec', async function () {
 *   const response = await supertest(app).get('/resource');
 *   expect(response).toSatisfyApiSpec();
 * });
 * ```
 * @public
 */
export function setupOpenapi(path: string): void {
  //@ts-expect-error - jest-openapi does not have types, but it extends expect, so we need to ignore the error
  globalThis.expect = expect;
  jestOpenApi.default(path);
  //@ts-expect-error - see above, we need to ignore the error to reset global expect
  globalThis.expect = undefined; // Reset global expect to avoid conflicts with other test frameworks
}

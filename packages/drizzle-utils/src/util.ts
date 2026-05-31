import type { DrizzleQueryError } from 'drizzle-orm';

/**
 * Type-guard that narrows an unknown value to a Drizzle ORM `DrizzleQueryError`.
 *
 * @param err - The value to test.
 * @returns `true` when `err` is a `DrizzleQueryError`, `false` otherwise.
 * @public
 */
export function isDrizzleQueryError(err: unknown): err is DrizzleQueryError {
  return typeof err === 'object' && err !== null && 'name' in err && (err as Error).name === 'DrizzleQueryError';
}

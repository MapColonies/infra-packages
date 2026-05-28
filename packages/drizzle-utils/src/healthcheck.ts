import type { Pool } from 'pg';

class TimeoutError extends Error {}

async function promiseTimeout<T>(ms: number, promise: Promise<T>): Promise<T> {
  // Create a promise that rejects in <ms> milliseconds
  const timeout = new Promise<T>((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new TimeoutError(`Timed out in + ${ms} + ms.`));
    }, ms);
  });

  // Returns a race between our timeout and the passed in promise
  return Promise.race([promise, timeout]);
}

const DEFAULT_DB_CONNECTION_TIMEOUT = 5000;

/**
 * Creates a health-check function that queries the database to verify connectivity.
 * The check times out and rejects if the database does not respond within the allotted time.
 *
 * @param connection - The `pg.Pool` to query.
 * @param dbConnectionTimeout - Maximum milliseconds to wait before treating the check as failed. Defaults to `5000`.
 * @returns An async function that resolves when the database is reachable, or rejects on timeout / error.
 * @public
 */
export function healthCheck(connection: Pool, dbConnectionTimeout = DEFAULT_DB_CONNECTION_TIMEOUT): () => Promise<void> {
  return async (): Promise<void> => {
    const check = connection.query('SELECT 1').then(() => {
      return;
    });
    return promiseTimeout<void>(dbConnectionTimeout, check);
  };
}

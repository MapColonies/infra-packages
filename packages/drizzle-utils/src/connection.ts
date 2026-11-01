import { readFileSync } from 'node:fs';
import { hostname } from 'node:os';
import { Pool, type PoolConfig } from 'pg';
import type { commonDbFullV1Type } from '@map-colonies/schemas';
import { validateSslCerts } from './ssl';

/**
 * Builds a `pg` from the given database options.
 * Validates SSL certificates when SSL is enabled.
 *
 * @param dbOptions - The database configuration object.
 * @returns A `PoolConfig` ready to be passed to a `pg.Pool` constructor.
 * @public
 */
export function createConnectionOptions(dbOptions: commonDbFullV1Type): PoolConfig {
  const { ssl, ...rest } = dbOptions;
  const dbConfig: PoolConfig = structuredClone(rest);
  dbConfig.application_name = `${hostname()}-${process.env.NODE_ENV ?? 'unknown_env'}`;
  dbConfig.user = dbOptions.username;
  if (ssl.enabled) {
    const key = readFileSync(ssl.key);
    const cert = readFileSync(ssl.cert);
    const ca = readFileSync(ssl.ca);
    validateSslCerts(key, cert, ca);
    dbConfig.password = undefined;
    dbConfig.ssl = { key, cert, ca };
  }

  return dbConfig;
}

/**
 * Options for {@link initConnection}.
 * @public
 */
export interface InitConnectionOptions {
  /**
   * Called when a pooled connection fails outside of a query, for example when the database restarts,
   * fails over, or terminates the session (`pg_terminate_backend`, `idle_in_transaction_session_timeout`).
   * The pool discards the broken connection and opens a new one on demand, so this is for reporting only.
   */
  onError?: (err: Error) => void;
}

/**
 * Creates and verifies a connected `pg.Pool` using the provided database configuration.
 * Executes a `SELECT NOW()` query to confirm the connection is healthy before returning.
 *
 * The pool and every connection it opens get an `'error'` listener, so a connection that the database
 * drops does not crash the process with an unhandled `'error'` event.
 *
 * @param dbConfig - The database configuration object.
 * @param options - Optional settings, such as an error reporter.
 * @returns A connected `pg.Pool` instance.
 * @public
 */
export async function initConnection(dbConfig: commonDbFullV1Type, options: InitConnectionOptions = {}): Promise<Pool> {
  const { onError = (): void => undefined } = options;
  const pool = new Pool(createConnectionOptions(dbConfig));

  // Every connection error, idle or checked out, reaches the connection's own listener.
  pool.on('connect', (client) =>
    client.on('error', (err) => {
      try {
        onError(err);
      } catch {
        // onError is for reporting only; a throwing reporter must not crash the process
      }
    })
  );
  // The pool re-emits errors of idle connections, which were already reported above.
  pool.on('error', () => undefined);

  try {
    await pool.query('SELECT NOW()');
  } catch (err) {
    await pool.end();
    throw err;
  }
  return pool;
}

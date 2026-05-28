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
 * Creates and verifies a connected `pg.Pool` using the provided database configuration.
 * Executes a `SELECT NOW()` query to confirm the connection is healthy before returning.
 *
 * @param dbConfig - The database configuration object.
 * @returns A connected `pg.Pool` instance.
 * @public
 */
export async function initConnection(dbConfig: commonDbFullV1Type): Promise<Pool> {
  const pool = new Pool(createConnectionOptions(dbConfig));
  await pool.query('SELECT NOW()');
  return pool;
}

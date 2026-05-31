import path from 'node:path';
import { describe, it, expect, beforeAll, afterAll, inject } from 'vitest';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { runMigrations } from '../src/migrations';

const FIXTURES_BASE = path.join(__dirname, 'fixtures');

describe('#runMigrations', function () {
  let pool: Pool;

  beforeAll(function () {
    pool = new Pool({
      host: inject('pgHost'),
      port: inject('pgPort'),
      database: inject('pgDatabase'),
      user: inject('pgUsername'),
      password: inject('pgPassword'),
    });
  });

  afterAll(async function () {
    await pool.end();
  });

  it('should run migrations and create the expected table', async function () {
    const db = drizzle({ client: pool });
    await runMigrations(db, 'drizzle_test', FIXTURES_BASE);

    const result = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'test_items'
    `);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toHaveProperty('table_name', 'test_items');
  });

  it('should be idempotent when run twice', async function () {
    const db = drizzle({ client: pool });
    await expect(runMigrations(db, 'drizzle_test', FIXTURES_BASE)).resolves.not.toThrow();
  });

  it('should throw when no migrations folder is found', async function () {
    const db = drizzle({ client: pool });
    await expect(runMigrations(db, 'drizzle_test', '/tmp/nonexistent-path-xyz')).rejects.toThrow('No migrations folder found');
  });
});

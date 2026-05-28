import { describe, it, expect, beforeAll, afterAll, inject } from 'vitest';
import type { commonDbFullV1Type } from '@map-colonies/schemas';
import { createConnectionOptions, initConnection } from '../src/connection';

function buildDbOptions(overrides: Partial<commonDbFullV1Type> = {}): commonDbFullV1Type {
  return {
    host: inject('pgHost'),
    port: inject('pgPort'),
    database: inject('pgDatabase'),
    username: inject('pgUsername'),
    password: inject('pgPassword'),
    schema: 'public',
    ssl: { enabled: false },
    ...overrides,
  } as commonDbFullV1Type;
}

describe('#createConnectionOptions', function () {
  it('should return options with application_name set', function () {
    const options = createConnectionOptions(buildDbOptions());
    expect(options.application_name).toBeDefined();
    expect(typeof options.application_name).toBe('string');
  });

  it('should map username to user field', function () {
    const options = createConnectionOptions(buildDbOptions());
    expect(options.user).toBe(inject('pgUsername'));
  });

  it('should not include ssl config when ssl is disabled', function () {
    const options = createConnectionOptions(buildDbOptions());
    expect(options.ssl).toBeUndefined();
  });

  it('should preserve host, port, and database from dbOptions', function () {
    const options = createConnectionOptions(buildDbOptions());
    expect(options.host).toBe(inject('pgHost'));
    expect(options.port).toBe(inject('pgPort'));
    expect(options.database).toBe(inject('pgDatabase'));
  });
});

describe('#initConnection', function () {
  let createdPools: { end: () => Promise<void> }[];

  beforeAll(function () {
    createdPools = [];
  });

  afterAll(async function () {
    await Promise.all(createdPools.map(async (pool) => pool.end()));
  });

  it('should return a connected pool', async function () {
    const pool = await initConnection(buildDbOptions());
    createdPools.push(pool);
    expect(pool).toBeDefined();
  });

  it('should return a pool that can execute queries', async function () {
    const pool = await initConnection(buildDbOptions());
    createdPools.push(pool);
    const result = await pool.query('SELECT 1 AS value');
    expect(result.rows[0]).toHaveProperty('value', 1);
  });

  it('should reject when given incorrect credentials', async function () {
    await expect(
      initConnection(
        buildDbOptions({
          password: 'definitely-wrong-password',
        })
      )
    ).rejects.toThrow();
  });
});

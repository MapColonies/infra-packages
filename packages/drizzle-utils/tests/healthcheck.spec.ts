import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { inject } from 'vitest';
import { Pool } from 'pg';
import { healthCheck } from '../src/healthcheck';

describe('#healthCheck', function () {
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

  it('should return a function', function () {
    const check = healthCheck(pool);
    expect(typeof check).toBe('function');
  });

  it('should resolve without error against a live database', async function () {
    const check = healthCheck(pool);
    await expect(check()).resolves.toBeUndefined();
  });

  it('should resolve when a custom timeout is provided', async function () {
    const check = healthCheck(pool, 3000);
    await expect(check()).resolves.toBeUndefined();
  });

  it('should reject when the timeout is exceeded', async function () {
    const closedPool = new Pool({
      host: inject('pgHost'),
      port: inject('pgPort'),
      database: inject('pgDatabase'),
      user: inject('pgUsername'),
      password: inject('pgPassword'),
    });
    await closedPool.end();

    const check = healthCheck(closedPool, 1);
    await expect(check()).rejects.toThrow();
  });
});

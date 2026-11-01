import { describe, it, expect, beforeAll, afterAll, inject, vi } from 'vitest';
import { Client, type Pool, type PoolClient } from 'pg';
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
  };
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

  describe('when the database terminates a connection', function () {
    let admin: Client;

    beforeAll(async function () {
      admin = new Client({
        host: inject('pgHost'),
        port: inject('pgPort'),
        database: inject('pgDatabase'),
        user: inject('pgUsername'),
        password: inject('pgPassword'),
      });
      await admin.connect();
    });

    afterAll(async function () {
      await admin.end();
    });

    async function getBackendPid(client: PoolClient): Promise<number> {
      const result = await client.query<{ pid: number }>('SELECT pg_backend_pid() AS pid');
      return result.rows[0]!.pid;
    }

    async function terminateAndWaitForError(pid: number, onError: ReturnType<typeof vi.fn>): Promise<void> {
      await admin.query('SELECT pg_terminate_backend($1)', [pid]);
      await vi.waitFor(() => expect(onError).toHaveBeenCalled());
    }

    async function expectPoolToWork(pool: Pool): Promise<void> {
      const result = await pool.query('SELECT 1 AS value');
      expect(result.rows[0]).toHaveProperty('value', 1);
    }

    it('should report an idle connection error and keep the pool working', async function () {
      const onError = vi.fn();
      const pool = await initConnection(buildDbOptions(), { onError });
      createdPools.push(pool);
      const client = await pool.connect();
      const pid = await getBackendPid(client);
      client.release();

      await terminateAndWaitForError(pid, onError);

      expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('terminating connection') as unknown }));
      await expectPoolToWork(pool);
    });

    it('should report a checked out connection error and keep the pool working', async function () {
      const onError = vi.fn();
      const pool = await initConnection(buildDbOptions(), { onError });
      createdPools.push(pool);
      const client = await pool.connect();
      const pid = await getBackendPid(client);

      await terminateAndWaitForError(pid, onError);

      await expect(client.query('SELECT 1')).rejects.toThrow();
      client.release(true);
      await expectPoolToWork(pool);
    });

    it('should report a connection terminated by idle_in_transaction_session_timeout', async function () {
      const onError = vi.fn();
      const pool = await initConnection(buildDbOptions(), { onError });
      createdPools.push(pool);
      const client = await pool.connect();
      await client.query('BEGIN');
      await client.query("SELECT set_config('idle_in_transaction_session_timeout', '100', true)");

      await vi.waitFor(() => expect(onError).toHaveBeenCalled(), { timeout: 2000 });

      expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('idle-in-transaction timeout') as unknown }));
      client.release(true);
      await expectPoolToWork(pool);
    });

    it('should not crash without an onError option', async function () {
      const pool = await initConnection(buildDbOptions());
      createdPools.push(pool);
      const idle = await pool.connect();
      const idlePid = await getBackendPid(idle);
      idle.release();
      const checkedOut = await pool.connect();
      const checkedOutPid = await getBackendPid(checkedOut);

      await admin.query('SELECT pg_terminate_backend(pid) FROM unnest($1::int[]) AS pid', [[idlePid, checkedOutPid]]);
      await vi.waitFor(() => expect(pool.idleCount).toBe(0));

      await expect(checkedOut.query('SELECT 1')).rejects.toThrow();
      checkedOut.release(true);
      await expectPoolToWork(pool);
    });
  });
});

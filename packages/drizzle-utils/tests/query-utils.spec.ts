import path from 'node:path';
import { describe, it, expect, beforeAll, beforeEach, afterAll, inject } from 'vitest';
import { Pool } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { eq } from 'drizzle-orm';
import { paginationParamsToOffsetAndLimit, DEFAULT_PAGE_SIZE, createDatesComparison, sortOptionsToOrderBy } from '../src/query-utils';
import { runMigrations } from '../src/migrations';

const FIXTURES_BASE = path.join(__dirname, 'fixtures');

const testItems = pgTable('test_items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

let pool: Pool;
let db: NodePgDatabase;

beforeAll(async function () {
  pool = new Pool({
    host: inject('pgHost'),
    port: inject('pgPort'),
    database: inject('pgDatabase'),
    user: inject('pgUsername'),
    password: inject('pgPassword'),
  });
  db = drizzle({ client: pool });
  await runMigrations(db, 'drizzle_query_utils_test', FIXTURES_BASE);
});

afterAll(async function () {
  await pool.end();
});

describe('#paginationParamsToOffsetAndLimit', function () {
  it('should return default limit and zero offset when called without params', function () {
    const result = paginationParamsToOffsetAndLimit();
    expect(result).toEqual({ limit: DEFAULT_PAGE_SIZE, offset: 0 });
  });

  it('should return default limit and zero offset when params are undefined', function () {
    const result = paginationParamsToOffsetAndLimit(undefined);
    expect(result).toEqual({ limit: DEFAULT_PAGE_SIZE, offset: 0 });
  });

  it('should return correct limit and offset for page 1', function () {
    const result = paginationParamsToOffsetAndLimit({ page: 1, pageSize: 20 });
    expect(result).toEqual({ limit: 20, offset: 0 });
  });

  it('should return correct limit and offset for page 2', function () {
    const result = paginationParamsToOffsetAndLimit({ page: 2, pageSize: 20 });
    expect(result).toEqual({ limit: 20, offset: 20 });
  });

  it('should return correct limit and offset for page 3 with pageSize 5', function () {
    const result = paginationParamsToOffsetAndLimit({ page: 3, pageSize: 5 });
    expect(result).toEqual({ limit: 5, offset: 10 });
  });

  it('should use provided pageSize as limit', function () {
    const result = paginationParamsToOffsetAndLimit({ page: 1, pageSize: 100 });
    expect(result.limit).toBe(100);
  });
});

describe('#createDatesComparison', function () {
  const JAN = new Date('2024-01-15T12:00:00Z');
  const MAR = new Date('2024-03-15T12:00:00Z');
  const JUN = new Date('2024-06-15T12:00:00Z');
  const SEP = new Date('2024-09-15T12:00:00Z');

  beforeEach(async function () {
    await db.delete(testItems).where(eq(testItems.name, testItems.name));
    await db.insert(testItems).values([
      { name: 'january', createdAt: JAN },
      { name: 'march', createdAt: MAR },
      { name: 'june', createdAt: JUN },
      { name: 'september', createdAt: SEP },
    ]);
  });

  it('should return undefined when no dates are provided', function () {
    const result = createDatesComparison(testItems.createdAt);
    expect(result).toBeUndefined();
  });

  it('should filter rows between earlyDate and laterDate', async function () {
    const condition = createDatesComparison(testItems.createdAt, MAR, JUN);
    const rows = await db.select().from(testItems).where(condition);
    const names = rows.map((r) => r.name).sort();
    expect(names).toEqual(['june', 'march']);
  });

  it('should filter rows after earlyDate when only earlyDate is provided', async function () {
    const condition = createDatesComparison(testItems.createdAt, JUN);
    const rows = await db.select().from(testItems).where(condition);
    const names = rows.map((r) => r.name).sort();
    expect(names).toEqual(['september']);
  });

  it('should filter rows before laterDate when only laterDate is provided', async function () {
    const condition = createDatesComparison(testItems.createdAt, undefined, MAR);
    const rows = await db.select().from(testItems).where(condition);
    const names = rows.map((r) => r.name).sort();
    expect(names).toEqual(['january']);
  });

  it('should return no rows when range matches nothing', async function () {
    const future = new Date('2099-01-01T00:00:00Z');
    const condition = createDatesComparison(testItems.createdAt, future);
    const rows = await db.select().from(testItems).where(condition);
    expect(rows).toHaveLength(0);
  });
});

describe('#sortOptionsToOrderBy', function () {
  beforeEach(async function () {
    await db.delete(testItems).where(eq(testItems.name, testItems.name));
    await db.insert(testItems).values([
      { name: 'banana', createdAt: new Date('2024-01-01T00:00:00Z') },
      { name: 'apple', createdAt: new Date('2024-02-01T00:00:00Z') },
      { name: 'cherry', createdAt: new Date('2024-03-01T00:00:00Z') },
    ]);
  });

  it('should return an empty array when sortOptions is empty', function () {
    const result = sortOptionsToOrderBy(testItems, {});
    expect(result).toEqual([]);
  });

  it('should order rows ascending by name', async function () {
    const orderBy = sortOptionsToOrderBy(testItems, { name: 'asc' });
    const rows = await db
      .select()
      .from(testItems)
      .orderBy(...orderBy);
    expect(rows.map((r) => r.name)).toEqual(['apple', 'banana', 'cherry']);
  });

  it('should order rows descending by name', async function () {
    const orderBy = sortOptionsToOrderBy(testItems, { name: 'desc' });
    const rows = await db
      .select()
      .from(testItems)
      .orderBy(...orderBy);
    expect(rows.map((r) => r.name)).toEqual(['cherry', 'banana', 'apple']);
  });

  it('should order rows by createdAt ascending', async function () {
    const orderBy = sortOptionsToOrderBy(testItems, { createdAt: 'asc' });
    const rows = await db
      .select()
      .from(testItems)
      .orderBy(...orderBy);
    expect(rows.map((r) => r.name)).toEqual(['banana', 'apple', 'cherry']);
  });

  it('should order rows by createdAt descending', async function () {
    const orderBy = sortOptionsToOrderBy(testItems, { createdAt: 'desc' });
    const rows = await db
      .select()
      .from(testItems)
      .orderBy(...orderBy);
    expect(rows.map((r) => r.name)).toEqual(['cherry', 'apple', 'banana']);
  });
});

describe('#paginationParamsToOffsetAndLimit', function () {
  it('should return default limit and zero offset when called without params', function () {
    const result = paginationParamsToOffsetAndLimit();
    expect(result).toEqual({ limit: DEFAULT_PAGE_SIZE, offset: 0 });
  });

  it('should return default limit and zero offset when params are undefined', function () {
    const result = paginationParamsToOffsetAndLimit(undefined);
    expect(result).toEqual({ limit: DEFAULT_PAGE_SIZE, offset: 0 });
  });

  it('should return correct limit and offset for page 1', function () {
    const result = paginationParamsToOffsetAndLimit({ page: 1, pageSize: 20 });
    expect(result).toEqual({ limit: 20, offset: 0 });
  });

  it('should return correct limit and offset for page 2', function () {
    const result = paginationParamsToOffsetAndLimit({ page: 2, pageSize: 20 });
    expect(result).toEqual({ limit: 20, offset: 20 });
  });

  it('should return correct limit and offset for page 3 with pageSize 5', function () {
    const result = paginationParamsToOffsetAndLimit({ page: 3, pageSize: 5 });
    expect(result).toEqual({ limit: 5, offset: 10 });
  });

  it('should use provided pageSize as limit', function () {
    const result = paginationParamsToOffsetAndLimit({ page: 1, pageSize: 100 });
    expect(result.limit).toBe(100);
  });
});

describe('#createDatesComparison', function () {
  const JAN = new Date('2024-01-15T12:00:00Z');
  const MAR = new Date('2024-03-15T12:00:00Z');
  const JUN = new Date('2024-06-15T12:00:00Z');
  const SEP = new Date('2024-09-15T12:00:00Z');

  beforeAll(async function () {
    await db.delete(testItems).where(eq(testItems.name, testItems.name));
    await db.insert(testItems).values([
      { name: 'january', createdAt: JAN },
      { name: 'march', createdAt: MAR },
      { name: 'june', createdAt: JUN },
      { name: 'september', createdAt: SEP },
    ]);
  });

  it('should return undefined when no dates are provided', function () {
    const result = createDatesComparison(testItems.createdAt);
    expect(result).toBeUndefined();
  });

  it('should filter rows between earlyDate and laterDate', async function () {
    const condition = createDatesComparison(testItems.createdAt, MAR, JUN);
    const rows = await db.select().from(testItems).where(condition);
    const names = rows.map((r) => r.name).sort();
    expect(names).toEqual(['june', 'march']);
  });

  it('should filter rows after earlyDate when only earlyDate is provided', async function () {
    const condition = createDatesComparison(testItems.createdAt, JUN);
    const rows = await db.select().from(testItems).where(condition);
    const names = rows.map((r) => r.name).sort();
    expect(names).toEqual(['september']);
  });

  it('should filter rows before laterDate when only laterDate is provided', async function () {
    const condition = createDatesComparison(testItems.createdAt, undefined, MAR);
    const rows = await db.select().from(testItems).where(condition);
    const names = rows.map((r) => r.name).sort();
    expect(names).toEqual(['january']);
  });

  it('should return no rows when range matches nothing', async function () {
    const future = new Date('2099-01-01T00:00:00Z');
    const condition = createDatesComparison(testItems.createdAt, future);
    const rows = await db.select().from(testItems).where(condition);
    expect(rows).toHaveLength(0);
  });
});

describe('#sortOptionsToOrderBy', function () {
  beforeAll(async function () {
    await db.delete(testItems).where(eq(testItems.name, testItems.name));
    await db.insert(testItems).values([
      { name: 'banana', createdAt: new Date('2024-01-01T00:00:00Z') },
      { name: 'apple', createdAt: new Date('2024-02-01T00:00:00Z') },
      { name: 'cherry', createdAt: new Date('2024-03-01T00:00:00Z') },
    ]);
  });

  it('should return an empty array when sortOptions is empty', function () {
    const result = sortOptionsToOrderBy(testItems, {});
    expect(result).toEqual([]);
  });

  it('should order rows ascending by name', async function () {
    const orderBy = sortOptionsToOrderBy(testItems, { name: 'asc' });
    const rows = await db
      .select()
      .from(testItems)
      .orderBy(...orderBy);
    expect(rows.map((r) => r.name)).toEqual(['apple', 'banana', 'cherry']);
  });

  it('should order rows descending by name', async function () {
    const orderBy = sortOptionsToOrderBy(testItems, { name: 'desc' });
    const rows = await db
      .select()
      .from(testItems)
      .orderBy(...orderBy);
    expect(rows.map((r) => r.name)).toEqual(['cherry', 'banana', 'apple']);
  });

  it('should order rows by createdAt ascending', async function () {
    const orderBy = sortOptionsToOrderBy(testItems, { createdAt: 'asc' });
    const rows = await db
      .select()
      .from(testItems)
      .orderBy(...orderBy);
    expect(rows.map((r) => r.name)).toEqual(['banana', 'apple', 'cherry']);
  });

  it('should order rows by createdAt descending', async function () {
    const orderBy = sortOptionsToOrderBy(testItems, { createdAt: 'desc' });
    const rows = await db
      .select()
      .from(testItems)
      .orderBy(...orderBy);
    expect(rows.map((r) => r.name)).toEqual(['cherry', 'apple', 'banana']);
  });
});

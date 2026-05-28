import { between, gt, lt, asc, desc } from 'drizzle-orm';
import type { Column, SQL, Subquery, AnyColumn } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import type { SortOptions } from './sort-parser';

/**
 * The default number of items returned per page when no pagination params are specified.
 * @public
 */
export const DEFAULT_PAGE_SIZE = 10;

/**
 * Parameters describing a page-based pagination request.
 * @public
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * Converts page-based {@link PaginationParams} into a `limit` / `offset` pair suitable for SQL queries.
 * When `paginationParams` is `undefined`, returns `{ limit: DEFAULT_PAGE_SIZE, offset: 0 }`.
 *
 * @param paginationParams - Optional pagination parameters.
 * @returns An object with `limit` and `offset` values.
 * @public
 */
export function paginationParamsToOffsetAndLimit(paginationParams?: PaginationParams): { limit: number; offset: number } {
  if (paginationParams === undefined) {
    return { limit: DEFAULT_PAGE_SIZE, offset: 0 };
  }

  const { page, pageSize } = paginationParams;

  return {
    limit: pageSize,
    offset: (page - 1) * pageSize,
  };
}

/**
 * Builds a Drizzle ORM `SQL` condition that filters a date column to a range.
 *
 * - Both dates provided → `BETWEEN earlyDate AND laterDate`
 * - Only `earlyDate` → `column > earlyDate`
 * - Only `laterDate` → `column < laterDate`
 * - Neither → `undefined`
 *
 * @param column - The Drizzle ORM column to filter on.
 * @param earlyDate - Optional lower bound (inclusive start) of the date range.
 * @param laterDate - Optional upper bound (inclusive end) of the date range.
 * @returns A Drizzle ORM `SQL` condition, or `undefined` when no dates are provided.
 * @public
 */
export function createDatesComparison(column: Column, earlyDate?: Date, laterDate?: Date): SQL | undefined {
  if (earlyDate !== undefined && laterDate !== undefined) {
    return between(column, earlyDate, laterDate);
  }
  if (earlyDate !== undefined) {
    return gt(column, earlyDate);
  }
  if (laterDate !== undefined) {
    return lt(column, laterDate);
  }
  return undefined;
}

/**
 * Converts a {@link SortOptions} map into an array of Drizzle ORM `SQL` `ORDER BY` expressions.
 *
 * @param tableDefinition - The Drizzle ORM table or subquery whose columns will be ordered.
 * @param sortOptions - A {@link SortOptions} map produced by {@link sortOptionParser}.
 * @returns An array of `SQL` expressions ready to be spread into a Drizzle `.orderBy()` call.
 * @public
 */
export function sortOptionsToOrderBy<T extends PgTable | Subquery>(tableDefinition: T, sortOptions: SortOptions<T>): SQL[] {
  const result: SQL[] = [];
  for (const key in sortOptions) {
    const direction = sortOptions[key];

    if (direction === 'asc') {
      result.push(asc(tableDefinition[key] as AnyColumn));
    } else if (direction === 'desc') {
      result.push(desc(tableDefinition[key] as AnyColumn));
    }
  }
  return result;
}

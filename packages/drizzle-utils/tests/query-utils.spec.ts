import { describe, it, expect } from 'vitest';
import { paginationParamsToOffsetAndLimit, DEFAULT_PAGE_SIZE } from '../src/query-utils';

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

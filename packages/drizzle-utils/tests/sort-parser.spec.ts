import { describe, it, expect } from 'vitest';
import { sortOptionParser, SortQueryRepeatError, SortQueryInvalidFieldError } from '../src/sort-parser';

interface TestEntity {
  name: string;
  createdAt: Date;
  age: number;
}

const fieldsMap = new Map<string, keyof TestEntity>([
  ['name', 'name'],
  ['created_at', 'createdAt'],
  ['age', 'age'],
]);

describe('#sortOptionParser', function () {
  it('should return empty object when sortArray is undefined', function () {
    const result = sortOptionParser<TestEntity>(undefined, fieldsMap);
    expect(result).toEqual({});
  });

  it('should return empty object when sortArray is empty', function () {
    const result = sortOptionParser<TestEntity>([], fieldsMap);
    expect(result).toEqual({});
  });

  it('should parse a single asc field', function () {
    const result = sortOptionParser<TestEntity>(['name:asc'], fieldsMap);
    expect(result).toEqual({ name: 'asc' });
  });

  it('should parse a single desc field', function () {
    const result = sortOptionParser<TestEntity>(['age:desc'], fieldsMap);
    expect(result).toEqual({ age: 'desc' });
  });

  it('should default to asc when no order is specified', function () {
    const result = sortOptionParser<TestEntity>(['name'], fieldsMap);
    expect(result).toEqual({ name: 'asc' });
  });

  it('should parse multiple fields with different orders', function () {
    const result = sortOptionParser<TestEntity>(['name:asc', 'age:desc'], fieldsMap);
    expect(result).toEqual({ name: 'asc', age: 'desc' });
  });

  it('should map external field name to entity key', function () {
    const result = sortOptionParser<TestEntity>(['created_at:asc'], fieldsMap);
    expect(result).toEqual({ createdAt: 'asc' });
  });

  it('should throw SortQueryRepeatError for duplicate fields', function () {
    expect(() => sortOptionParser<TestEntity>(['name:asc', 'name:desc'], fieldsMap)).toThrow(SortQueryRepeatError);
  });

  it('should throw SortQueryInvalidFieldError for unknown field', function () {
    expect(() => sortOptionParser<TestEntity>(['unknown:asc'], fieldsMap)).toThrow(SortQueryInvalidFieldError);
  });

  it('should include the invalid field name in the error message', function () {
    expect(() => sortOptionParser<TestEntity>(['badField:asc'], fieldsMap)).toThrow('badField');
  });

  it('should include the duplicate field name in the error message', function () {
    expect(() => sortOptionParser<TestEntity>(['name:asc', 'name:desc'], fieldsMap)).toThrow('name');
  });
});

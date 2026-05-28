import { describe, it, expect } from 'vitest';
import { isDrizzleQueryError } from '../src/util';

describe('#isDrizzleQueryError', function () {
  it('should return true for an object with name "DrizzleQueryError"', function () {
    const err = { name: 'DrizzleQueryError', message: 'some db error' };
    expect(isDrizzleQueryError(err)).toBe(true);
  });

  it('should return false for a plain Error', function () {
    expect(isDrizzleQueryError(new Error('oops'))).toBe(false);
  });

  it('should return false for null', function () {
    expect(isDrizzleQueryError(null)).toBe(false);
  });

  it('should return false for undefined', function () {
    expect(isDrizzleQueryError(undefined)).toBe(false);
  });

  it('should return false for a string', function () {
    expect(isDrizzleQueryError('error string')).toBe(false);
  });

  it('should return false for a number', function () {
    expect(isDrizzleQueryError(42)).toBe(false);
  });

  it('should return false for an object without a name property', function () {
    expect(isDrizzleQueryError({ message: 'no name here' })).toBe(false);
  });

  it('should return false for an object with a different name', function () {
    expect(isDrizzleQueryError({ name: 'SomeOtherError' })).toBe(false);
  });
});

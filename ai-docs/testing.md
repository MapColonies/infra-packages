# Testing Guide

## Framework

- **Test runner**: Vitest 4.x
- **Config**: Extends from `vitest-config` workspace package
- **Coverage**: Vitest coverage-v8 (text, html, json reports)

## Running Tests

```bash
# All tests
pnpm run test

# Specific package
turbo run test --filter=@map-colonies/tracing

# Single test file
pnpm --filter @map-colonies/tracing test tests/tracing.spec.ts

# Watch mode (from package directory)
cd packages/js-logger && pnpm test:watch

# UI mode (from package directory)
cd packages/prometheus && pnpm test:ui
```

## Test Structure

**IMPORTANT**: Use `function()` syntax, NOT arrow functions

```typescript
describe('package-name', function () {
  beforeAll(function () {
    // Setup
  });

  afterEach(function () {
    // Cleanup
  });

  it('should describe expected behavior', function () {
    // Arrange
    const input = {};

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.value).toBe(expected);
  });
});
```

## Test Organization

- **Location**: `tests/` directory at package root
- **Naming**: `*.spec.ts` (e.g., `logger.spec.ts`) - never `*.test.ts`
- **Subdirectories**: Organize by feature when needed
- **Test names**: Descriptive, starting with "should"

## Testing Tools

- **HTTP mocking**: `nock`
- **Express testing**: `supertest`
- **Type testing**: `expectTypeOf` (built into Vitest)
- **Coverage**: Vitest coverage-v8

## Example Test

```typescript
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import nock from 'nock';

describe('myFunction', function () {
  beforeAll(function () {
    nock.disableNetConnect();
  });

  afterEach(function () {
    nock.cleanAll();
  });

  it('should return expected value', function () {
    const result = myFunction({ input: 'test' });
    expect(result).toBe('expected');
  });
});
```

## Type Testing

Use Vitest's built-in `expectTypeOf` for compile-time type assertions:

```typescript
import { describe, it, expect, expectTypeOf } from 'vitest';

it('should have correct types', function () {
  const result = myFunction({ foo: 'bar' });

  // Runtime assertion
  expect(result).toBeDefined();

  // Type assertion (compile-time)
  expectTypeOf(result).toHaveProperty('id');
  expectTypeOf(result.id).toBeString();
  expectTypeOf(myFunction).parameter(0).toHaveProperty('foo');
});
```

**Common type assertions:**

- `.toEqualTypeOf<T>()` - Exact type match
- `.toMatchTypeOf<T>()` - Subset match
- `.toHaveProperty('key')` - Property exists
- `.toBeString()`, `.toBeNumber()`, etc. - Primitive types
- `.parameter(n)` - Test function parameter types
- `.returns` - Test return type

## Vitest Config Pattern

```typescript
// package-level vitest.config.ts
import { mergeConfig, defineProject } from 'vitest/config';
import sharedConfig from 'vitest-config';

export default mergeConfig(
  sharedConfig,
  defineProject({
    test: {
      root: __dirname,
      // package-specific overrides
    },
  })
);
```

## Testing Gotchas

1. **Use `function()` syntax**: Arrow functions NOT allowed in test callbacks
2. **Test files must be `*.spec.ts`**: Never use `*.test.ts`
3. **No magic numbers in tests**: ESLint rule disabled for test files
